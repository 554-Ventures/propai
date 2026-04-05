import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app";
import prisma from "../lib/prisma";
import { signToken } from "../middleware/auth";
import type { Property } from "@prisma/client";

describe("Property Archive API", () => {
  let authToken: string;
  let organizationId: string;
  let userId: string;
  let propertyId: string;
  let unitId: string;

  beforeEach(async () => {
    organizationId = "test-org-id";
    userId = "test-user-id";
    authToken = signToken({ 
      id: userId, 
      email: "test@example.com", 
      orgId: organizationId, 
      role: "ADMIN" 
    });

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

    // Create test unit
    const unit = await prisma.unit.create({
      data: {
        id: "test-unit-id",
        label: "Unit A",
        userId,
        organizationId,
        propertyId,
        rentAmount: 1000
      }
    });
    unitId = unit.id;
  });

  afterEach(async () => {
    await prisma.lease.deleteMany({ where: { organizationId } });
    await prisma.unit.deleteMany({ where: { organizationId } });
    await prisma.property.deleteMany({ where: { organizationId } });
    await prisma.aiActionLog.deleteMany({ where: { organizationId } });
    await prisma.aiSecurityEvent.deleteMany({ where: { organizationId } });
    await prisma.tenant.deleteMany({ where: { organizationId } });
  });

  describe("POST /properties/:id/archive", () => {
    it("should successfully archive property without active leases", async () => {
      const response = await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "Testing archive" });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(propertyId);
      expect(response.body.archivedAt).toBeDefined();

      // Verify property is archived in database
      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });
      expect(property?.archivedAt).not.toBeNull();

      // Verify unit is also archived
      const unit = await prisma.unit.findUnique({
        where: { id: unitId }
      });
      expect(unit?.archivedAt).not.toBeNull();
    });

    it("should block archiving property with active leases", async () => {
      // Create tenant and active lease
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

      await prisma.lease.create({
        data: {
          id: "test-lease-id",
          userId,
          organizationId,
          propertyId,
          unitId,
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
        .send({ reason: "Should fail" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("ACTIVE_LEASES_EXIST");
      expect(response.body.message).toBe("Cannot archive property with active leases");
      expect(response.body.details.activeLeaseCount).toBe(1);

      // Verify property is NOT archived
      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });
      expect(property?.archivedAt).toBeNull();
    });

    it("should require ADMIN/OWNER role", async () => {
      const memberToken = signToken({
        id: "member-user",
        email: "member@example.com",
        orgId: organizationId,
        role: "MEMBER"
      });

      const response = await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ reason: "Member trying to archive" });

      expect(response.status).toBe(403);
    });

    it("should prevent cross-organization access", async () => {
      const otherOrgToken = signToken({
        id: "other-user",
        email: "other@example.com",
        orgId: "other-org-id",
        role: "ADMIN"
      });

      const response = await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${otherOrgToken}`)
        .send({ reason: "Cross org attempt" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Property not found or already archived");
    });

    it("should prevent double archiving", async () => {
      // Archive once
      await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "First archive" });

      // Try to archive again
      const response = await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "Second archive" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Property not found or already archived");
    });

    it("should create audit log entry", async () => {
      await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "Audit test" });

      const auditLog = await prisma.aiActionLog.findFirst({
        where: {
          organizationId,
          actionType: "property_archive",
          status: "completed"
        }
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.userId).toBe(userId);
      
      const payload = auditLog!.payload as any;
      expect(payload.propertyId).toBe(propertyId);
      expect(payload.propertyName).toBe("Test Property");
      expect(payload.reason).toBe("Audit test");
    });

    it("should sanitize malicious input in audit logs", async () => {
      const maliciousReason = "Archive <script>alert('xss')</script> test\\x00";

      await request(app)
        .post(`/properties/${propertyId}/archive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: maliciousReason });

      const auditLog = await prisma.aiActionLog.findFirst({
        where: {
          organizationId,
          actionType: "property_archive"
        }
      });

      const payload = auditLog!.payload as Record<string, unknown>;
      expect(payload.reason).not.toContain("<script>");
      expect(payload.reason).not.toContain("\\x00");
    });
  });

  describe("POST /properties/:id/unarchive", () => {
    beforeEach(async () => {
      // Archive the property first
      await prisma.property.update({
        where: { id: propertyId },
        data: { archivedAt: new Date() }
      });
      await prisma.unit.updateMany({
        where: { propertyId },
        data: { archivedAt: new Date() }
      });
    });

    it("should successfully unarchive property", async () => {
      const response = await request(app)
        .post(`/properties/${propertyId}/unarchive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "Testing unarchive" });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(propertyId);
      expect(response.body.archivedAt).toBeNull();

      // Verify property is unarchived in database
      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });
      expect(property?.archivedAt).toBeNull();

      // Verify unit is also unarchived
      const unit = await prisma.unit.findUnique({
        where: { id: unitId }
      });
      expect(unit?.archivedAt).toBeNull();
    });

    it("should return 404 for non-archived property", async () => {
      // Unarchive the property first
      await prisma.property.update({
        where: { id: propertyId },
        data: { archivedAt: null }
      });

      const response = await request(app)
        .post(`/properties/${propertyId}/unarchive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "Should fail" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Archived property not found");
    });

    it("should create audit log for unarchive", async () => {
      await request(app)
        .post(`/properties/${propertyId}/unarchive`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "Unarchive test" });

      const auditLog = await prisma.aiActionLog.findFirst({
        where: {
          organizationId,
          actionType: "property_unarchive",
          status: "completed"
        }
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.userId).toBe(userId);
      
      const payload = auditLog!.payload as Record<string, unknown>;
      expect(payload.propertyId).toBe(propertyId);
      expect(payload.reason).toBe("Unarchive test");
    });
  });

  describe("GET /properties with archive filtering", () => {
    let archivedPropertyId: string;

    beforeEach(async () => {
      // Create second property and archive it
      const archivedProperty = await prisma.property.create({
        data: {
          id: "archived-property-id",
          name: "Archived Property",
          userId,
          organizationId,
          addressLine1: "456 Archived St",
          city: "Archive City",
          state: "AC",
          postalCode: "67890",
          archivedAt: new Date()
        }
      });
      archivedPropertyId = archivedProperty.id;
    });

    it("should exclude archived properties by default", async () => {
      const response = await request(app)
        .get("/properties")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(propertyId);
      expect(response.body[0].name).toBe("Test Property");
    });

    it("should include archived properties when requested", async () => {
      const response = await request(app)
        .get("/properties?includeArchived=true")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      
      const propertyIds = response.body.map((p: Property) => p.id);
      expect(propertyIds).toContain(propertyId);
      expect(propertyIds).toContain(archivedPropertyId);
    });

    it("should not include archived properties with includeArchived=false", async () => {
      const response = await request(app)
        .get("/properties?includeArchived=false")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(propertyId);
    });
  });
});