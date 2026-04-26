import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = Router();

const StudentInput = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  level: z.string().min(1),
  contact: z.string().optional().nullable(),
  hourlyRate: z.coerce.number().nonnegative(),
  currency: z.string().default("EUR"),
  status: z.enum(["active", "paused", "ended"]).default("active"),
  notes: z.string().optional().nullable(),
});

function serialize(s: Awaited<ReturnType<typeof prisma.student.findFirst>>) {
  if (!s) return null;
  return {
    ...s,
    hourlyRate: Number(s.hourlyRate),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/students", async (req, res, next) => {
  try {
    const search = (req.query.search as string | undefined)?.trim();
    const rows = await prisma.student.findMany({
      where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
      orderBy: { updatedAt: "desc" },
    });
    res.json(rows.map(serialize));
  } catch (e) { next(e); }
});

router.post("/students", async (req, res, next) => {
  try {
    const body = StudentInput.parse(req.body);
    const row = await prisma.student.create({
      data: { ...body, hourlyRate: body.hourlyRate.toString() },
    });
    res.status(201).json(serialize(row));
  } catch (e) { next(e); }
});

router.put("/students/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const body = StudentInput.parse(req.body);
    const row = await prisma.student.update({
      where: { id },
      data: { ...body, hourlyRate: body.hourlyRate.toString() },
    });
    res.json(serialize(row));
  } catch (e) { next(e); }
});

router.delete("/students/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.student.delete({ where: { id } });
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
