import request from "supertest";
import app from "../app";
import prisma from "../lib/prisma";

const testUser = {
  email: "test@example.com",
  password: "Password123!",
  name: "Test User"
};

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

describe("auth", () => {
  it("signs up a new user", async () => {
    const res = await request(app).post("/auth/signup").send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(testUser.email);
  });

  it("logs in an existing user", async () => {
    const res = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: testUser.password
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
});
