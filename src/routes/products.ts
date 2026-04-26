import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = Router();

const ProductInput = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
  price: z.coerce.number().nonnegative(),
  currency: z.string().default("EUR"),
  notes: z.string().optional().nullable(),
});

function serialize(p: Awaited<ReturnType<typeof prisma.product.findFirst>>) {
  if (!p) return null;
  return {
    ...p,
    price: Number(p.price),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/products", async (req, res, next) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.query.search) where.name = { contains: String(req.query.search), mode: "insensitive" };
    if (req.query.category) where.category = req.query.category;
    if (req.query.status) where.status = req.query.status;
    const rows = await prisma.product.findMany({ where, orderBy: { updatedAt: "desc" } });
    res.json(rows.map(serialize));
  } catch (e) { next(e); }
});

router.post("/products", async (req, res, next) => {
  try {
    const body = ProductInput.parse(req.body);
    const row = await prisma.product.create({ data: { ...body, price: body.price.toString() } });
    res.status(201).json(serialize(row));
  } catch (e) { next(e); }
});

router.put("/products/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const body = ProductInput.parse(req.body);
    const row = await prisma.product.update({
      where: { id },
      data: { ...body, price: body.price.toString() },
    });
    res.json(serialize(row));
  } catch (e) { next(e); }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
