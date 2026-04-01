import { Router } from "express";

const router: Router = Router();

router.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

export default router;
