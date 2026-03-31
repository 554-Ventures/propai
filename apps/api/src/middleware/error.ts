import type { Request, Response, NextFunction } from "express";

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof Error) {
    res.status(500).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Unexpected error" });
};
