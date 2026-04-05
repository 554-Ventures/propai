import { beforeAll, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";
import prisma from "../lib/prisma";

const testUser = {
  email: "maintenance-s3@example.com",
  password: "Password123!",
  name: "Maintenance S3 User"
};

const cleanupUserData = async () => {
  const user = await prisma.user.findUnique({ where: { email: testUser.email } });
  if (!user) {
    return;
  }

  const userId = user.id;
  const organizationId = user.defaultOrgId;

  await prisma.aIInsight.deleteMany({ where: { organizationId } });
  await prisma.expense.deleteMany({ where: { organizationId } });
  await prisma.payment.deleteMany({ where: { organizationId } });
  await prisma.document.deleteMany({ where: { organizationId } });
  await prisma.maintenanceRequest.deleteMany({ where: { organizationId } });
  await prisma.lease.deleteMany({ where: { organizationId } });
  await prisma.unit.deleteMany({ where: { organizationId } });
  await prisma.tenant.deleteMany({ where: { organizationId } });
  await prisma.vendor.deleteMany({ where: { organizationId } });
  await prisma.property.deleteMany({ where: { organizationId } });
  await prisma.membership.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.organization.deleteMany({ where: { id: organizationId } });
};

const createUserAndToken = async () => {
  await cleanupUserData();
  await request(app).post("/auth/signup").send({ ...testUser, organizationName: "Maintenance S3 Org" });
  const login = await request(app).post("/auth/login").send({
    email: testUser.email,
    password: testUser.password
  });
  return login.body.token as string;
};

beforeAll(async () => {
  await cleanupUserData();
});

afterAll(async () => {
  await cleanupUserData();
  await prisma.$disconnect();
});

describe("S3 Maintenance - Property-Scoped Endpoints", () => {
  it("creates and filters maintenance with property-scoped endpoints", async () => {
    const token = await createUserAndToken();

    // Create a property
    const propertyRes = await request(app)
      .post("/properties")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Maintenance Test Property",
        addressLine1: "456 Main St",
        city: "Austin", 
        state: "TX",
        postalCode: "78701"
      });

    expect(propertyRes.status).toBe(201);
    const propertyId = propertyRes.body.id;

    // Create units
    const unit1Res = await request(app)
      .post("/units")
      .set("Authorization", `Bearer ${token}`)
      .send({
        propertyId,
        label: "101",
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 800,
        rent: 1500
      });

    const unit2Res = await request(app)
      .post("/units")
      .set("Authorization", `Bearer ${token}`)
      .send({
        propertyId,
        label: "102",
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: 600,
        rent: 1200
      });

    expect(unit1Res.status).toBe(201);
    expect(unit2Res.status).toBe(201);
    const unit1Id = unit1Res.body.id;
    const unit2Id = unit2Res.body.id;

    // Create property-level maintenance (no unit)
    const propertyMaintenanceRes = await request(app)
      .post(`/properties/${propertyId}/maintenance`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Property-wide HVAC Service",
        description: "Annual HVAC maintenance for entire property",
        cost: 500
      });

    expect(propertyMaintenanceRes.status).toBe(201);
    expect(propertyMaintenanceRes.body.title).toBe("Property-wide HVAC Service");
    expect(propertyMaintenanceRes.body.unitId).toBeNull();

    // Create unit-specific maintenance
    const unit1MaintenanceRes = await request(app)
      .post(`/properties/${propertyId}/maintenance`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Unit 101 Leaky Faucet",
        description: "Kitchen faucet dripping",
        cost: 75,
        unitId: unit1Id
      });

    expect(unit1MaintenanceRes.status).toBe(201);
    expect(unit1MaintenanceRes.body.title).toBe("Unit 101 Leaky Faucet");
    expect(unit1MaintenanceRes.body.unitId).toBe(unit1Id);

    const unit2MaintenanceRes = await request(app)
      .post(`/properties/${propertyId}/maintenance`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Unit 102 Broken Door",
        description: "Front door lock stuck",
        cost: 120,
        unitId: unit2Id
      });

    expect(unit2MaintenanceRes.status).toBe(201);
    
    // Test filtering: Get all maintenance
    const allMaintenanceRes = await request(app)
      .get(`/properties/${propertyId}/maintenance?unit=all&status=all`)
      .set("Authorization", `Bearer ${token}`);

    expect(allMaintenanceRes.status).toBe(200);
    expect(allMaintenanceRes.body.length).toBe(3);

    // Test filtering: Get only property-level maintenance
    const propertyOnlyRes = await request(app)
      .get(`/properties/${propertyId}/maintenance?unit=property`)
      .set("Authorization", `Bearer ${token}`);

    expect(propertyOnlyRes.status).toBe(200);
    expect(propertyOnlyRes.body.length).toBe(1);
    expect(propertyOnlyRes.body[0].title).toBe("Property-wide HVAC Service");

    // Test filtering: Get maintenance for specific unit
    const unit1OnlyRes = await request(app)
      .get(`/properties/${propertyId}/maintenance?unit=${unit1Id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(unit1OnlyRes.status).toBe(200);
    expect(unit1OnlyRes.body.length).toBe(1);
    expect(unit1OnlyRes.body[0].title).toBe("Unit 101 Leaky Faucet");

    // Update status and test status filtering
    const maintenanceId = unit1MaintenanceRes.body.id;
    await request(app)
      .patch(`/maintenance/${maintenanceId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "IN_PROGRESS" });

    // Test filtering: Get only pending maintenance
    const pendingRes = await request(app)
      .get(`/properties/${propertyId}/maintenance?status=pending`)
      .set("Authorization", `Bearer ${token}`);

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.length).toBe(2); // Property + Unit 102 maintenance

    // Test filtering: Get only in_progress maintenance  
    const inProgressRes = await request(app)
      .get(`/properties/${propertyId}/maintenance?status=in_progress`)
      .set("Authorization", `Bearer ${token}`);

    expect(inProgressRes.status).toBe(200);
    expect(inProgressRes.body.length).toBe(1);
    expect(inProgressRes.body[0].title).toBe("Unit 101 Leaky Faucet");
  });

  it("handles archived units correctly", async () => {
    const token = await createUserAndToken();

    // Create property and unit
    const propertyRes = await request(app)
      .post("/properties")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Archive Test Property",
        addressLine1: "789 Archive St", 
        city: "Austin",
        state: "TX",
        postalCode: "78701"
      });

    const propertyId = propertyRes.body.id;

    const unitRes = await request(app)
      .post("/units")
      .set("Authorization", `Bearer ${token}`)
      .send({
        propertyId,
        label: "201",
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: 500,
        rent: 1000
      });

    const unitId = unitRes.body.id;

    // Create maintenance for unit while active
    const maintenanceRes = await request(app)
      .post(`/properties/${propertyId}/maintenance`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Active Unit Maintenance",
        description: "Before archiving",
        unitId: unitId
      });

    expect(maintenanceRes.status).toBe(201);
    expect(maintenanceRes.body.isHistorical).toBe(false);

    // Archive the unit
    await request(app)
      .patch(`/units/${unitId}`)
      .set("Authorization", `Bearer ${token}`) 
      .send({ archivedAt: new Date().toISOString() });

    // Verify maintenance for archived unit shows as historical
    const afterArchiveRes = await request(app)
      .get(`/properties/${propertyId}/maintenance`)
      .set("Authorization", `Bearer ${token}`);

    expect(afterArchiveRes.status).toBe(200);
    expect(afterArchiveRes.body.length).toBe(1);
    expect(afterArchiveRes.body[0].isHistorical).toBe(true);
    expect(afterArchiveRes.body[0].unit.archivedAt).not.toBeNull();

    // Should still be able to create maintenance for archived unit (legacy support)
    const legacyMaintenanceRes = await request(app)
      .post(`/properties/${propertyId}/maintenance`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Legacy Maintenance",
        description: "Maintenance on archived unit",
        unitId: unitId
      });

    expect(legacyMaintenanceRes.status).toBe(201);
    expect(legacyMaintenanceRes.body.isHistorical).toBe(true);
  });

  it("validates property ownership and input", async () => {
    const token = await createUserAndToken();

    // Test invalid property ID
    const invalidPropertyRes = await request(app)
      .get("/properties/invalid-id/maintenance")
      .set("Authorization", `Bearer ${token}`);

    expect(invalidPropertyRes.status).toBe(404);

    // Create property for other tests
    const propertyRes = await request(app)
      .post("/properties")  
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Validation Test Property",
        addressLine1: "123 Validation St",
        city: "Austin",
        state: "TX", 
        postalCode: "78701"
      });

    const propertyId = propertyRes.body.id;

    // Test missing title in POST
    const noTitleRes = await request(app)
      .post(`/properties/${propertyId}/maintenance`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Missing title"
      });

    expect(noTitleRes.status).toBe(400);

    // Test invalid unit ID  
    const invalidUnitRes = await request(app)
      .post(`/properties/${propertyId}/maintenance`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Maintenance",
        unitId: "invalid-unit-id"  
      });

    expect(invalidUnitRes.status).toBe(400);
  });

  it("enforces organization isolation", async () => {
    // Create two different organizations
    const token1 = await createUserAndToken();
    
    const org2User = {
      email: "maintenance-org2@example.com", 
      password: "Password123!",
      name: "Org2 User"
    };

    await request(app).post("/auth/signup").send({ 
      ...org2User, 
      organizationName: "Other Org" 
    });
    
    const login2 = await request(app).post("/auth/login").send({
      email: org2User.email,
      password: org2User.password
    });
    
    const token2 = login2.body.token;

    // Create property in org1
    const org1PropertyRes = await request(app)
      .post("/properties")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        name: "Org1 Property",
        addressLine1: "111 Org1 St",
        city: "Austin",
        state: "TX", 
        postalCode: "78701"
      });

    const org1PropertyId = org1PropertyRes.body.id;

    // User from org2 should not access org1 property maintenance
    const crossOrgAccessRes = await request(app)
      .get(`/properties/${org1PropertyId}/maintenance`)
      .set("Authorization", `Bearer ${token2}`);

    expect(crossOrgAccessRes.status).toBe(404);

    // User from org2 should not create maintenance for org1 property  
    const crossOrgCreateRes = await request(app)
      .post(`/properties/${org1PropertyId}/maintenance`)
      .set("Authorization", `Bearer ${token2}`)
      .send({
        title: "Cross-org maintenance attempt"
      });

    expect(crossOrgCreateRes.status).toBe(404);

    // Cleanup org2 user
    const org2User_db = await prisma.user.findUnique({ where: { email: org2User.email } });
    if (org2User_db) {
      const org2Id = org2User_db.defaultOrgId;
      await prisma.membership.deleteMany({ where: { userId: org2User_db.id } });
      await prisma.user.deleteMany({ where: { id: org2User_db.id } });
      await prisma.organization.deleteMany({ where: { id: org2Id } });
    }
  });
});