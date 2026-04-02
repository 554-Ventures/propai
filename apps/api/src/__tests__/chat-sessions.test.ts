import request from "supertest";
import app from "../app";
import prisma from "../lib/prisma";

const user1 = {
  email: "chat1@example.com",
  password: "Password123!",
  name: "Chat User 1"
};

const user2 = {
  email: "chat2@example.com",
  password: "Password123!",
  name: "Chat User 2"
};

const cleanupUser = async (email: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) return;

  const userId = existing.id;
  const organizationId = existing.defaultOrgId;

  // Chat data
  const sessions = await prisma.chatSession.findMany({ where: { userId, organizationId }, select: { id: true } });
  const sessionIds = sessions.map((s) => s.id);
  if (sessionIds.length > 0) {
    const messages = await prisma.chatMessage.findMany({ where: { sessionId: { in: sessionIds } }, select: { id: true } });
    const messageIds = messages.map((m) => m.id);
    if (messageIds.length > 0) {
      await prisma.toolCallLog.deleteMany({ where: { messageId: { in: messageIds } } });
    }
    await prisma.chatMessage.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await prisma.chatSession.deleteMany({ where: { id: { in: sessionIds } } });
  }

  // Other user/org data (keep minimal but consistent with other tests)
  await prisma.aiUsage.deleteMany({ where: { organizationId } });
  await prisma.aiSecurityEvent.deleteMany({ where: { organizationId } });
  await prisma.aIInsight.deleteMany({ where: { organizationId } });

  await prisma.membership.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.organization.deleteMany({ where: { id: organizationId } });
};

const signupAndLogin = async (user: typeof user1) => {
  await cleanupUser(user.email);
  await request(app).post("/auth/signup").send({ ...user, organizationName: `Org for ${user.email}` });
  const login = await request(app).post("/auth/login").send({ email: user.email, password: user.password });
  return login.body.token as string;
};

afterAll(async () => {
  await cleanupUser(user1.email);
  await cleanupUser(user2.email);
  await prisma.$disconnect();
});

describe("chat sessions", () => {
  it("creates and lists sessions scoped to current user+org", async () => {
    const token1 = await signupAndLogin(user1);

    const s1 = await request(app)
      .post("/api/chat/sessions")
      .set("Authorization", `Bearer ${token1}`)
      .send({});
    expect(s1.status).toBe(201);

    const s2 = await request(app)
      .post("/api/chat/sessions")
      .set("Authorization", `Bearer ${token1}`)
      .send({});
    expect(s2.status).toBe(201);

    const list1 = await request(app)
      .get("/api/chat/sessions")
      .set("Authorization", `Bearer ${token1}`);

    expect(list1.status).toBe(200);
    expect(Array.isArray(list1.body)).toBe(true);
    expect(list1.body.length).toBe(2);

    // Another user/org should not see sessions
    const token2 = await signupAndLogin(user2);
    const list2 = await request(app)
      .get("/api/chat/sessions")
      .set("Authorization", `Bearer ${token2}`);

    expect(list2.status).toBe(200);
    expect(Array.isArray(list2.body)).toBe(true);
    expect(list2.body.length).toBe(0);
  });

  it("clears messages but keeps the session", async () => {
    const token = await signupAndLogin(user1);

    const sessionRes = await request(app)
      .post("/api/chat/sessions")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    const sessionId = sessionRes.body.id as string;

    await prisma.chatMessage.createMany({
      data: [
        { sessionId, role: "user", content: "Hello" },
        { sessionId, role: "assistant", content: "Hi" }
      ]
    });

    const clearRes = await request(app)
      .post(`/api/chat/sessions/${sessionId}/clear`)
      .set("Authorization", `Bearer ${token}`);

    expect(clearRes.status).toBe(200);

    const messageCount = await prisma.chatMessage.count({ where: { sessionId } });
    expect(messageCount).toBe(0);

    const sessionExists = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    expect(sessionExists).toBeTruthy();
  });

  it("deletes a session and its messages", async () => {
    const token = await signupAndLogin(user1);

    const sessionRes = await request(app)
      .post("/api/chat/sessions")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    const sessionId = sessionRes.body.id as string;

    await prisma.chatMessage.create({
      data: { sessionId, role: "user", content: "Delete me" }
    });

    const delRes = await request(app)
      .delete(`/api/chat/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(delRes.status).toBe(200);

    const sessionExists = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    expect(sessionExists).toBeNull();

    const messageCount = await prisma.chatMessage.count({ where: { sessionId } });
    expect(messageCount).toBe(0);
  });
});
