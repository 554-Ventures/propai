import request from "supertest";
import app from "../app";
import prisma from "../lib/prisma";

const testUser = {
  email: "property@example.com",
  password: "Password123!",
  name: "Property User"
};

const createUserAndToken = async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await request(app).post("/auth/signup").send(testUser);
  const login = await request(app).post("/auth/login").send({
    email: testUser.email,
    password: testUser.password
  });
  return login.body.token as string;
};

beforeAll(async () => {
  await prisma.property.deleteMany({});
});

afterAll(async () => {
  await prisma.property.deleteMany({ where: { user: { email: testUser.email } } });
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

describe("properties", () => {
  it("creates and lists properties", async () => {
    const token = await createUserAndToken();

    const createRes = await request(app)
      .post("/properties")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Oak Street Duplex",
        addressLine1: "123 Oak St",
        city: "Austin",
        state: "TX",
        postalCode: "78701"
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe("Oak Street Duplex");

    const listRes = await request(app)
      .get("/properties")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThan(0);
  });
});
