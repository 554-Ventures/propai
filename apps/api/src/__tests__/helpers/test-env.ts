import "dotenv/config";

export const API_URL = process.env.API_URL ?? "http://localhost:4000";

export const uniqueEmail = (prefix = "test") => {
  const rand = Math.random().toString(16).slice(2);
  return `${prefix}.${Date.now()}.${rand}@example.com`;
};

