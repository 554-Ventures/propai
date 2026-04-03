import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app.js";
import { signupAndGetToken } from "./helpers/auth.js";

describe("/ai/chat (integration)", () => {
  it("returns clarify+draft+result for a cashflow expense flow", async () => {
    const { token } = await signupAndGetToken();

    // 1) Start: missing category (should clarify)
    const r1 = await request(app)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Log an expense $50 today" })
      .expect(200);

    expect(r1.body.mode).toBe("clarify");
    expect(typeof r1.body.pendingActionId).toBe("string");
    expect(r1.body.pendingActionId.length).toBeGreaterThan(5);
    expect(r1.body.clarify?.choices?.length ?? 0).toBeGreaterThan(0);

    const actionId = r1.body.pendingActionId as string;

    // 2) Follow-up: provide category via JSON patch
    const r2 = await request(app)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: JSON.stringify({ category: "Utilities" }), pendingActionId: actionId })
      .expect(200);

    expect(r2.body.mode).toBe("draft");
    expect(r2.body.pendingActionId).toBe(actionId);

    // 3) Confirm
    const r3 = await request(app)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ confirm: true, pendingActionId: actionId, clientRequestId: "req-1" })
      .expect(200);

    expect(r3.body.mode).toBe("result");
  });

  it("does not mis-apply unrelated follow-up text as cashflow category", async () => {
    const { token } = await signupAndGetToken();

    const r1 = await request(app)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Log an expense $50 today" })
      .expect(200);

    expect(r1.body.mode).toBe("clarify");
    const actionId = r1.body.pendingActionId as string;

    const r2 = await request(app)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "add 4 units", pendingActionId: actionId })
      .expect(200);

    // Should remain in clarify (still needs category) and not corrupt the draft.
    expect(["clarify", "draft"]).toContain(r2.body.mode);
    // If it stayed clarify, ensure it's still asking for missing fields, not proceeding.
    if (r2.body.mode === "clarify") {
      expect(r2.body.summary).toMatch(/need/i);
    }
  });

  it("confirm requires clientRequestId and is idempotent when replayed", async () => {
    const { token } = await signupAndGetToken();

    const r1 = await request(app)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Log an expense $50 today category Utilities" })
      .expect(200);

    // Depending on the model's tool-planning, it may still ask a clarifying question
    // even when category is present. Both are acceptable as long as we get a
    // pendingActionId we can confirm idempotently.
    expect(["draft", "clarify"]).toContain(r1.body.mode);
    const actionId = r1.body.pendingActionId as string;

    // If we got a clarify, provide the missing field(s) before confirming.
    if (r1.body.mode === "clarify") {
      await request(app)
        .post("/ai/chat")
        .set("Authorization", `Bearer ${token}`)
        .send({ message: JSON.stringify({ category: "Utilities" }), pendingActionId: actionId })
        .expect(200);
    }

    // clientRequestId required
    await request(app)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ confirm: true, pendingActionId: actionId })
      .expect(400);

    const r2 = await request(app)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ confirm: true, pendingActionId: actionId, clientRequestId: "idem-1" })
      .expect(200);
    expect(r2.body.mode).toBe("result");

    const r3 = await request(app)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ confirm: true, pendingActionId: actionId, clientRequestId: "idem-1" })
      .expect(200);
    expect(r3.body.mode).toBe("result");
    expect(JSON.stringify(r3.body.result)).toBe(JSON.stringify(r2.body.result));
  });
});

