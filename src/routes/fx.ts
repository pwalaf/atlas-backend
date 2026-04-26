import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = Router();

const FxInput = z.object({
  currency: z.string().min(1),
  rateToBase: z.coerce.number().positive(),
});

function serialize(r: { currency: string; rateToBase: { toString(): string }; updatedAt: Date }) {
  return { currency: r.currency, rateToBase: Number(r.rateToBase), updatedAt: r.updatedAt.toISOString() };
}

router.get("/fx", async (_req, res, next) => {
  try {
    const rows = await prisma.fxRate.findMany({ orderBy: { currency: "asc" } });
    res.json(rows.map(serialize));
  } catch (e) { next(e); }
});

router.put("/fx", async (req, res, next) => {
  try {
    const body = FxInput.parse(req.body);
    const row = await prisma.fxRate.upsert({
      where: { currency: body.currency },
      update: { rateToBase: body.rateToBase.toString() },
      create: { currency: body.currency, rateToBase: body.rateToBase.toString() },
    });
    res.json(serialize(row));
  } catch (e) { next(e); }
});

router.delete("/fx/:currency", async (req, res, next) => {
  try {
    await prisma.fxRate.delete({ where: { currency: req.params.currency } });
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
