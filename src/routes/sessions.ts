import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = Router();

const SessionInput = z.object({
  studentId: z.coerce.number().int(),
  occurredAt: z.string(),
  durationMinutes: z.coerce.number().int().positive(),
  ratePerHour: z.coerce.number().nonnegative(),
  currency: z.string().default("EUR"),
  paid: z.coerce.boolean().default(false),
  notes: z.string().optional().nullable(),
});

function serialize(s: Awaited<ReturnType<typeof prisma.lessonSession.findFirst>>) {
  if (!s) return null;
  return {
    ...s,
    ratePerHour: Number(s.ratePerHour),
    amount: Number(s.amount),
    occurredAt: s.occurredAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/sessions", async (req, res, next) => {
  try {
    const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
    const rows = await prisma.lessonSession.findMany({
      where: studentId ? { studentId } : undefined,
      orderBy: { occurredAt: "desc" },
    });
    res.json(rows.map(serialize));
  } catch (e) { next(e); }
});

router.post("/sessions", async (req, res, next) => {
  try {
    const body = SessionInput.parse(req.body);
    const student = await prisma.student.findUnique({ where: { id: body.studentId } });
    if (!student) return res.status(400).json({ error: "Unknown student" });
    const amount = (body.ratePerHour * body.durationMinutes) / 60;
    const row = await prisma.lessonSession.create({
      data: {
        studentId: body.studentId,
        studentName: student.name,
        occurredAt: new Date(body.occurredAt),
        durationMinutes: body.durationMinutes,
        ratePerHour: body.ratePerHour.toString(),
        currency: body.currency,
        amount: amount.toFixed(2),
        paid: body.paid,
        notes: body.notes ?? null,
      },
    });
    res.status(201).json(serialize(row));
  } catch (e) { next(e); }
});

router.put("/sessions/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const body = SessionInput.parse(req.body);
    const student = await prisma.student.findUnique({ where: { id: body.studentId } });
    if (!student) return res.status(400).json({ error: "Unknown student" });
    const amount = (body.ratePerHour * body.durationMinutes) / 60;
    const row = await prisma.lessonSession.update({
      where: { id },
      data: {
        studentId: body.studentId,
        studentName: student.name,
        occurredAt: new Date(body.occurredAt),
        durationMinutes: body.durationMinutes,
        ratePerHour: body.ratePerHour.toString(),
        currency: body.currency,
        amount: amount.toFixed(2),
        paid: body.paid,
        notes: body.notes ?? null,
      },
    });
    res.json(serialize(row));
  } catch (e) { next(e); }
});

router.delete("/sessions/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.lessonSession.delete({ where: { id } });
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
