import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = Router();

const GoalsInput = z.object({
  baseCurrency: z.string().min(1),
  monthlyTarget: z.coerce.number().nonnegative(),
  reinvestPct: z.coerce.number().int().min(0).max(100),
  expensePct: z.coerce.number().int().min(0).max(100),
  savingsPct: z.coerce.number().int().min(0).max(100),
});

function serialize(g: Awaited<ReturnType<typeof prisma.goals.findFirst>>) {
  if (!g) return null;
  return { ...g, monthlyTarget: Number(g.monthlyTarget), updatedAt: g.updatedAt.toISOString() };
}

router.get("/goals", async (_req, res, next) => {
  try {
    let row = await prisma.goals.findUnique({ where: { id: 1 } });
    if (!row) {
      row = await prisma.goals.create({ data: { id: 1 } });
    }
    res.json(serialize(row));
  } catch (e) { next(e); }
});

router.put("/goals", async (req, res, next) => {
  try {
    const body = GoalsInput.parse(req.body);
    if (body.reinvestPct + body.expensePct + body.savingsPct !== 100) {
      return res.status(400).json({ error: "Allocation must equal 100%" });
    }
    const row = await prisma.goals.upsert({
      where: { id: 1 },
      update: { ...body, monthlyTarget: body.monthlyTarget.toString() },
      create: { id: 1, ...body, monthlyTarget: body.monthlyTarget.toString() },
    });
    res.json(serialize(row));
  } catch (e) { next(e); }
});

export default router;
