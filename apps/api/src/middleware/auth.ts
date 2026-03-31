import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = header.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, getSecret()) as { sub?: string; email?: string };
    if (!payload.sub || !payload.email) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const signToken = (user: { id: string; email: string }) => {
  return jwt.sign({ sub: user.id, email: user.email }, getSecret(), { expiresIn: "7d" });
};
