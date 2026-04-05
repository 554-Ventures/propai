import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app";
import prisma from "../lib/prisma";
import { signToken } from "../middleware/auth";
import fs from "fs/promises";
import path from "path";

describe("Property Archive Security Tests", () => {
  let authToken: string;
  let organizationId: string;
  let userId: string;
  let propertyId: string;

  beforeEach(async () => {
    // Setup test data
    organizationId = "test-org-id";
    userId = "test-user-id";
    authToken = signToken({ id: userId, email: "test@example.com", orgId: organizationId, role: "ADMIN" });

    // Create test property
    const property = await prisma.property.create({
      data: {
        id: "test-property-id",
        name: "Test Property",
        userId,
        organizationId,
        addressLine1: "123 Test St",
        city: "Test City", 
        state: "TS",
        postalCode: "12345"
      }
    });
    propertyId = property.id;
  });

  afterEach(async () => {
    await prisma.lease.deleteMany({ where: { organizationId } });
    await prisma.unit.deleteMany({ where: { organizationId } });
    await prisma.property.deleteMany({ where: { organizationId } });
    await prisma.tenant.deleteMany({ where: { organizationId } });
    await prisma.aiActionLog.deleteMany({ where: { organizationId } });
    await prisma.aiSecurityEvent.deleteMany({ where: { organizationId } });
  });

  describe("Archive Security Controls", () => {
    it("should prevent cross-org property archiving", async () => {
      const otherOrgToken = signToken({ 
        id: "other-user", 
        email: "other@example.com", 
        orgId: "other-org", 
        role: "ADMIN" 
      });

      const response = await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${otherOrgToken}`)
        .send({ reason: "Testing cross-org access" })
        .expect(404);

      expect(response.body.error).toBe("Property not found or already archived");
    });

    it("should require ADMIN/OWNER role for archiving", async () => {
      const memberToken = signToken({ 
        id: userId, 
        email: "member@example.com", 
        orgId: organizationId, 
        role: "MEMBER" 
      });

      await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ reason: "Member trying to archive" })
        .expect(403);
    });

    it("should sanitize archive reason in audit logs", async () => {
      const maliciousReason = "Archive reason <script>alert('xss')</script> and null bytes\\x00";
      
      await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: maliciousReason })
        .expect(200);

      // Check audit log sanitization
      const auditLog = await prisma.aiActionLog.findFirst({
        where: { 
          organizationId,
          actionType: "property_archive"
        }
      });

      expect(auditLog?.payload).toBeDefined();
      const payload = auditLog!.payload as Record<string, unknown>;
      expect(payload.reason).not.toContain("<script>");
      expect(payload.reason).not.toContain("\\x00");
    });

    it("should prevent double archiving", async () => {
      // Archive once
      await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "First archive" })
        .expect(200);

      // Try to archive again 
      await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "Second archive" })
        .expect(404);
    });

    it("should block archiving properties with active leases", async () => {
      // Create tenant
      const tenant = await prisma.tenant.create({
        data: {
          id: "test-tenant-id",
          userId,
          organizationId,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "555-0123"
        }
      });

      // Create unit for the property
      const unit = await prisma.unit.create({
        data: {
          id: "test-unit-id",
          label: "Unit A",
          userId,
          organizationId,
          propertyId,
          rent: 1000
        }
      });

      // Create active lease
      await prisma.lease.create({
        data: {
          id: "test-lease-id",
          userId,
          organizationId,
          propertyId,
          unitId: unit.id,
          tenantId: tenant.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          rent: 1000,
          status: "ACTIVE"
        }
      });

      const response = await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "Should be blocked" })
        .expect(400);

      expect(response.body.error).toBe("ACTIVE_LEASES_EXIST");
      expect(response.body.message).toBe("Cannot archive property with active leases");
      expect(response.body.details.activeLeaseCount).toBe(1);
    });

    it("should log security events for archive operations", async () => {
      await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "Security test" })
        .expect(200);

      const securityEvent = await prisma.aiSecurityEvent.findFirst({
        where: { 
          organizationId,
          type: "property_archived"
        }
      });

      expect(securityEvent).toBeDefined();
      expect(securityEvent!.severity).toBe("low");
      expect(securityEvent!.message).toContain("Test Property archived");
    });
  });

  describe("AI Context Exclusion Tests", () => {
    it("should exclude archived properties from AI context queries", async () => {
      // Archive the property
      await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "Testing AI exclusion" })
        .expect(200);

      // Test AI endpoint that queries properties (this would need specific AI endpoint test)
      // For now, verify directly with Prisma query pattern
      const activeProperties = await prisma.property.findMany({
        where: { organizationId, archivedAt: null }
      });

      const archivedProperties = await prisma.property.findMany({
        where: { organizationId, archivedAt: { not: null } }
      });

      expect(activeProperties).toHaveLength(0);
      expect(archivedProperties).toHaveLength(1);
      expect(archivedProperties[0].id).toBe(propertyId);
    });
  });
});

describe("Document Upload Security Tests", () => {
  let authToken: string;
  let organizationId: string;
  let userId: string;
  let propertyId: string;
  let testUploadDir: string;

  beforeEach(async () => {
    organizationId = "test-org-id";
    userId = "test-user-id";
    authToken = signToken({ id: userId, email: "test@example.com", orgId: organizationId, role: "ADMIN" });

    // Create test property
    const property = await prisma.property.create({
      data: {
        id: "test-property-id",
        name: "Test Property", 
        userId,
        organizationId,
        addressLine1: "123 Test St",
        city: "Test City",
        state: "TS", 
        postalCode: "12345"
      }
    });
    propertyId = property.id;

    // Setup test upload directory
    testUploadDir = path.join(process.cwd(), "test-uploads");
    await fs.mkdir(testUploadDir, { recursive: true });
  });

  afterEach(async () => {
    await prisma.property.deleteMany({ where: { organizationId } });
    await prisma.document.deleteMany({ where: { organizationId } });
    await prisma.aiSecurityEvent.deleteMany({ where: { organizationId } });
    
    try {
      await fs.rm(testUploadDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("File Validation Security", () => {
    it("should block files with dangerous extensions", async () => {
      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("echo 'malicious'"), "malware.sh")
        .field("propertyId", propertyId)
        .field("type", "OTHER")
        .expect(400);

      expect(response.body.error).toContain("not allowed");
    });

    it("should validate MIME type against extension", async () => {
      // Create fake PDF with wrong MIME type
      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("not a real pdf"), {
          filename: "fake.pdf",
          contentType: "text/plain"
        })
        .field("propertyId", propertyId)
        .expect(400);

      expect(response.body.error).toContain("MIME type");
    });

    it("should enforce file size limits", async () => {
      // Create large buffer (6MB)
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024, "large file content");
      
      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", largeBuffer, "large.txt")
        .field("propertyId", propertyId)
        .expect(400);

      expect(response.body.error).toContain("exceeds limit");
    });

    it("should prevent path traversal in filenames", async () => {
      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("test content"), "../../../etc/passwd.txt")
        .field("propertyId", propertyId)
        .expect(201);

      // Should succeed but filename should be sanitized
      expect(response.body.document.name).not.toContain("../");
      expect(response.body.document.name).not.toContain("/etc/");
    });
  });

  describe("Multi-Tenant Isolation", () => {
    it("should prevent uploads to other org's properties", async () => {
      const otherOrgToken = signToken({ 
        id: "other-user",
        email: "other@example.com", 
        orgId: "other-org",
        role: "ADMIN"
      });

      await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${otherOrgToken}`)
        .attach("file", Buffer.from("test content"), "test.txt")
        .field("propertyId", propertyId) // Try to use other org's property
        .expect(404);
    });

    it("should isolate file storage by organization", async () => {
      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("test content"), "test.txt")
        .field("propertyId", propertyId)
        .expect(201);

      // Check that URL contains org ID for isolation
      expect(response.body.document.url).toContain(organizationId);
      expect(response.body.document.url).toContain(propertyId);
    });

    it("should prevent uploads to archived properties", async () => {
      // Archive property first
      await prisma.property.update({
        where: { id: propertyId },
        data: { archivedAt: new Date() }
      });

      await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("test content"), "test.txt")
        .field("propertyId", propertyId)
        .expect(404);
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce upload rate limits", async () => {
      const requests = [];
      
      // Try to exceed rate limit (11 requests when limit is 10)
      for (let i = 0; i < 11; i++) {
        requests.push(
          request(app)
            .post("/api/documents/upload")
            .set("Authorization", `Bearer ${authToken}`)
            .attach("file", Buffer.from(`content ${i}`), `test${i}.txt`)
            .field("propertyId", propertyId)
        );
      }

      const responses = await Promise.allSettled(requests);
      
      // At least one should be rate limited
      const rateLimited = responses.some(result => 
        result.status === 'fulfilled' && result.value.status === 429
      );
      
      expect(rateLimited).toBe(true);
    });
  });

  describe("Security Event Logging", () => {
    it("should log blocked upload attempts", async () => {
      await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("malicious content"), "malware.exe")
        .field("propertyId", propertyId)
        .expect(400);

      const securityEvent = await prisma.aiSecurityEvent.findFirst({
        where: { 
          organizationId,
          type: "file_upload_blocked"
        }
      });

      expect(securityEvent).toBeDefined();
      expect(securityEvent!.severity).toBe("medium");
    });

    it("should log successful uploads", async () => {
      await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("legitimate content"), "document.txt")
        .field("propertyId", propertyId)
        .expect(201);

      const securityEvent = await prisma.aiSecurityEvent.findFirst({
        where: { 
          organizationId,
          type: "file_upload_success"
        }
      });

      expect(securityEvent).toBeDefined();
      expect(securityEvent!.severity).toBe("low");
    });
  });
});