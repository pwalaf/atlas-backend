import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = Router();

const TransactionInput = z.object({
  type: z.enum(["income", "expense"]),
  source: z.enum(["tutoring", "apps", "pdfs", "other"]),
  category: z.string().min(1),
  amount: z.coerce.number(),
  currency: z.string().default("EUR"),
  occurredAt: z.string(),
  description: z.string().optional().nullable(),
});

function serialize(t: Awaited<ReturnType<typeof prisma.transaction.findFirst>>) {
  if (!t) return null;
  return {
    ...t,
    amount: Number(t.amount),
    occurredAt: t.occurredAt.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

router.get("/transactions", async (_req, res, next) => {
  try {
    const rows = await prisma.transaction.findMany({ orderBy: { occurredAt: "desc" } });
    res.json(rows.map(serialize));
  } catch (e) { next(e); }
});

router.post("/transactions", async (req, res, next) => {
  try {
    const body = TransactionInput.parse(req.body);
    const row = await prisma.transaction.create({
      data: {
        ...body,
        amount: body.amount.toString(),
        occurredAt: new Date(body.occurredAt),
      },
    });
    res.status(201).json(serialize(row));
  } catch (e) { next(e); }
});

router.put("/transactions/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const body = TransactionInput.parse(req.body);
    const row = await prisma.transaction.update({
      where: { id },
      data: {
        ...body,
        amount: body.amount.toString(),
        occurredAt: new Date(body.occurredAt),
      },
    });
    res.json(serialize(row));
  } catch (e) { next(e); }
});

router.delete("/transactions/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.transaction.delete({ where: { id } });
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
