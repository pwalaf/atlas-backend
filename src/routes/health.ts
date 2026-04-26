import { Router } from "express";

const router = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

export default router;
