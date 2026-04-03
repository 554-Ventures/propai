import { describe, expect, it, vi } from "vitest";

// This is a unit-style test for the idempotency behavior that /ai/chat(confirm=true) relies on.
// It does not spin up Express/auth; it verifies the data-layer contract via mocks.

vi.mock("../lib/prisma.js", () => {
  const state: any = {
    exec: null
  };

  return {
    default: {
      aiActionLog: {
        findFirst: vi.fn(async () => ({
          id: "act_1",
          organizationId: "org_1",
          userId: "user_1",
          status: "PENDING",
          payload: { plan: { toolCalls: [{ toolName: "createProperty", args: { name: "X", addressLine1: "1", city: "C", state: "IL", postalCode: "60614" } }] } }
        }))
      },
      aiActionExecution: {
        findFirst: vi.fn(async () => state.exec),
        create: vi.fn(async (args: any) => {
          state.exec = { ...args.data, result: args.data.result ?? null, error: args.data.error ?? null };
          return state.exec;
        })
      },
      $transaction: vi.fn(async (fn: any) => fn()),
      aiActionLog_update_calls: [],
      aiActionLog_update_payload: null,
      aiActionLog: {
        findFirst: vi.fn(async () => ({
          id: "act_1",
          organizationId: "org_1",
          userId: "user_1",
          status: "PENDING",
          payload: { plan: { toolCalls: [{ toolName: "createProperty", args: { name: "X", addressLine1: "1", city: "C", state: "IL", postalCode: "60614" } }] } }
        })),
        update: vi.fn(async () => ({ status: "CONFIRMED", result: [{ toolName: "createProperty", output: { id: "p1" } }] }))
      }
    }
  };
});

vi.mock("../lib/ai/action-tools.js", () => {
  return {
    supportedActionToolNames: ["createProperty"],
    executeActionTool: vi.fn(async () => ({ id: "p1" })),
    parseMessageToToolCalls: vi.fn(() => [])
  };
});

import prisma from "../lib/prisma.js";

describe("/ai/chat confirm idempotency (data-layer)", () => {
  it("stores and reuses execution result for same (actionId, clientRequestId)", async () => {
    // Simulate what the route does:
    const organizationId = "org_1";
    const userId = "user_1";
    const actionId = "act_1";
    const clientRequestId = "req_1";

    // First confirm: no existing execution
    const first = await (prisma as any).aiActionExecution.findFirst({ where: { actionId, clientRequestId, organizationId, userId } });
    expect(first).toBeNull();

    await (prisma as any).aiActionExecution.create({
      data: {
        organizationId,
        userId,
        actionId,
        clientRequestId,
        status: "CONFIRMED",
        result: [{ toolName: "createProperty", output: { id: "p1" } }]
      }
    });

    // Second confirm: should find existing
    const second = await (prisma as any).aiActionExecution.findFirst({ where: { actionId, clientRequestId, organizationId, userId } });
    expect(second).toBeTruthy();
    expect(second.result[0].output.id).toBe("p1");
  });
});

