import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
    ai?: {
      originalMessage?: string;
      sanitizedMessage?: string;
      promptInjectionMatches?: string[];
      moderation?: {
        flagged: boolean;
        categories: Record<string, boolean>;
      };
    };
  }
}
