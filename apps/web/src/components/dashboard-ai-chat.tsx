"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { sendChatMessage } from "../lib/chat-events";

const exampleQuestions = [
  "How much rent did I collect last month?",
  "Show me my expenses",
  "List my properties",
  "Any leases ending soon?"
];

export default function DashboardAiChat() {
  const [input, setInput] = useState("");

  const handleSend = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendChatMessage(trimmed);
    setInput("");
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/40 via-card/80 to-accent/30 p-8 shadow-2xl shadow-primary/10">
      <div className="pointer-events-none absolute -left-10 top-6 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-6 -top-10 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-foreground">Ask PropAI ✨</h2>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                ✨ AI
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your AI command center for rent, expenses, leases, and portfolio insight.
            </p>
          </div>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent-foreground">
            Magical answers, instantly
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder="Ask anything about your portfolio..."
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/70 focus:outline-none"
            />
          </div>
          <Button
            className="h-12 rounded-2xl bg-gradient-to-r from-primary via-primary to-accent text-sm text-primary-foreground shadow-lg shadow-primary/20"
            onClick={() => handleSend(input)}
          >
            Send to PropAI
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {exampleQuestions.map((question) => (
            <button
              key={question}
              onClick={() => handleSend(question)}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground transition hover:border-primary/70 hover:text-foreground"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
