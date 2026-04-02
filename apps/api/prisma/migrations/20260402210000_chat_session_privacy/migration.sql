-- Make chat sessions/messages safe to delete/clear and scoped by (orgId,userId)

-- Ensure deleting a session cascades to its messages, and deleting a message cascades to tool call logs.
ALTER TABLE "ToolCallLog" DROP CONSTRAINT IF EXISTS "ToolCallLog_messageId_fkey";
ALTER TABLE "ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_sessionId_fkey";

ALTER TABLE "ChatMessage"
  ADD CONSTRAINT "ChatMessage_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "ToolCallLog"
  ADD CONSTRAINT "ToolCallLog_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Helpful indexes for per-user session lists and history.
CREATE INDEX IF NOT EXISTS "ChatSession_organizationId_userId_idx" ON "ChatSession"("organizationId", "userId");
CREATE INDEX IF NOT EXISTS "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");
