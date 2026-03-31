import "express";

declare global {
  namespace Express {
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
}

export {};
