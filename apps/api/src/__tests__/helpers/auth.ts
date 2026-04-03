import request from "supertest";
import app from "../../app.js";
import { uniqueEmail } from "./test-env.js";

export const signupAndGetToken = async (opts?: { orgName?: string; password?: string }) => {
  const email = uniqueEmail("ai");
  const password = opts?.password ?? "Password123!";
  const organizationName = opts?.orgName ?? `Org-${Date.now()}`;

  const res = await request(app)
    .post("/auth/signup")
    .send({ email, password, organizationName, name: "Test User" })
    .expect(201);

  return {
    email,
    password,
    token: res.body.token as string,
    organizationId: res.body.organization?.id as string,
    userId: res.body.user?.id as string
  };
};

