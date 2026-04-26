import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

type RateMap = Record<string, number>;

async function loadContext() {
  let goals = await prisma.goals.findUnique({ where: { id: 1 } });
  if (!goals) goals = await prisma.goals.create({ data: { id: 1 } });
  const fx = await prisma.fxRate.findMany();
  const rates: RateMap = { [goals.baseCurrency]: 1 };
  for (const r of fx) rates[r.currency] = Number(r.rateToBase);
  return {
    baseCurrency: goals.baseCurrency,
    monthlyTarget: Number(goals.monthlyTarget),
    rates,
  };
}

function toBase(amount: number, currency: string, rates: RateMap, base: string): number {
  if (currency === base) return amount;
  const rate = rates[currency];
  return rate ? amount * rate : amount;
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + delta, 1));
  return monthKey(d);
}

async function loadEvents() {
  const [transactions, sessions] = await Promise.all([
    prisma.transaction.findMany(),
    prisma.lessonSession.findMany({ where: { paid: true } }),
  ]);
  return [
    ...transactions.map((t) => ({
      type: t.type,
      source: t.source,
      amount: Number(t.amount),
      currency: t.currency,
      occurredAt: t.occurredAt,
    })),
    ...sessions.map((s) => ({
      type: "income" as const,
      source: "tutoring",
      amount: Number(s.amount),
      currency: s.currency,
      occurredAt: s.occurredAt,
    })),
  ];
}

router.get("/finance/overview", async (_req, res, next) => {
  try {
    const ctx = await loadContext();
    const events = await loadEvents();
    const now = new Date();
    const thisMonth = monthKey(now);
    const prevMonth = shiftMonth(thisMonth, -1);

    let monthIncome = 0, monthExpense = 0, prevIncome = 0;
    for (const e of events) {
      const k = monthKey(e.occurredAt);
      const v = toBase(e.amount, e.currency, ctx.rates, ctx.baseCurrency);
      if (k === thisMonth) {
        if (e.type === "income") monthIncome += v;
        else monthExpense += v;
      }
      if (k === prevMonth && e.type === "income") prevIncome += v;
    }

    const unpaid = await prisma.lessonSession.findMany({ where: { paid: false } });
    const unpaidTotal = unpaid.reduce(
      (acc, s) => acc + toBase(Number(s.amount), s.currency, ctx.rates, ctx.baseCurrency),
      0,
    );

    res.json({
      baseCurrency: ctx.baseCurrency,
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
      prevMonthIncome: prevIncome,
      monthlyTarget: ctx.monthlyTarget,
      progressPct: ctx.monthlyTarget > 0 ? (monthIncome / ctx.monthlyTarget) * 100 : 0,
      unpaidTotal,
      unpaidCount: unpaid.length,
    });
  } catch (e) { next(e); }
});

router.get("/finance/timeseries", async (req, res, next) => {
  try {
    const ctx = await loadContext();
    const events = await loadEvents();
    const months = Math.min(36, Math.max(1, Number(req.query.months) || 12));
    const now = new Date();
    const start = monthKey(now);
    const keys: string[] = [];
    for (let i = months - 1; i >= 0; i--) keys.push(shiftMonth(start, -i));
    const map = new Map<string, { income: number; expense: number }>();
    for (const k of keys) map.set(k, { income: 0, expense: 0 });
    for (const e of events) {
      const k = monthKey(e.occurredAt);
      if (!map.has(k)) continue;
      const cell = map.get(k)!;
      const v = toBase(e.amount, e.currency, ctx.rates, ctx.baseCurrency);
      if (e.type === "income") cell.income += v;
      else cell.expense += v;
    }
    res.json(keys.map((k) => ({ month: k, ...map.get(k)! })));
  } catch (e) { next(e); }
});

router.get("/finance/by-source", async (req, res, next) => {
  try {
    const ctx = await loadContext();
    const events = await loadEvents();
    const months = Math.min(36, Math.max(1, Number(req.query.months) || 6));
    const now = new Date();
    const cutoff = shiftMonth(monthKey(now), -(months - 1));
    const totals = new Map<string, number>();
    for (const e of events) {
      if (e.type !== "income") continue;
      if (monthKey(e.occurredAt) < cutoff) continue;
      const v = toBase(e.amount, e.currency, ctx.rates, ctx.baseCurrency);
      totals.set(e.source, (totals.get(e.source) ?? 0) + v);
    }
    res.json(Array.from(totals.entries()).map(([source, total]) => ({ source, total })));
  } catch (e) { next(e); }
});

// Polynomial regression via Gaussian elimination (degree 1-3).
function regress(xs: number[], ys: number[], degree: number): number[] {
  const n = degree + 1;
  const X: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const Y: number[] = new Array(n).fill(0);
  for (let i = 0; i < xs.length; i++) {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) X[r]![c]! += Math.pow(xs[i]!, r + c);
      Y[r]! += ys[i]! * Math.pow(xs[i]!, r);
    }
  }
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(X[r]![i]!) > Math.abs(X[pivot]![i]!)) pivot = r;
    [X[i], X[pivot]] = [X[pivot]!, X[i]!];
    [Y[i], Y[pivot]] = [Y[pivot]!, Y[i]!];
    for (let r = i + 1; r < n; r++) {
      const f = X[r]![i]! / (X[i]![i]! || 1e-9);
      for (let c = i; c < n; c++) X[r]![c]! -= f * X[i]![c]!;
      Y[r]! -= f * Y[i]!;
    }
  }
  const coeffs = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = Y[i]!;
    for (let c = i + 1; c < n; c++) s -= X[i]![c]! * coeffs[c];
    coeffs[i] = s / (X[i]![i]! || 1e-9);
  }
  return coeffs;
}

function polyEval(coeffs: number[], x: number): number {
  let v = 0;
  for (let i = coeffs.length - 1; i >= 0; i--) v = v * x + coeffs[i]!;
  return v;
}

function rsquared(ys: number[], preds: number[]): number {
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < ys.length; i++) {
    ssTot += (ys[i]! - mean) ** 2;
    ssRes += (ys[i]! - preds[i]!) ** 2;
  }
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

router.get("/finance/projection", async (req, res, next) => {
  try {
    const ctx = await loadContext();
    const events = await loadEvents();
    const degree = Math.min(3, Math.max(1, Number(req.query.degree) || 1));
    const horizon = Math.min(24, Math.max(1, Number(req.query.horizon) || 6));
    const history = Math.min(36, Math.max(3, Number(req.query.history) || 12));

    const now = new Date();
    const start = monthKey(now);
    const histKeys: string[] = [];
    for (let i = history - 1; i >= 0; i--) histKeys.push(shiftMonth(start, -i));

    const incomeByMonth = new Map<string, number>();
    for (const k of histKeys) incomeByMonth.set(k, 0);
    for (const e of events) {
      if (e.type !== "income") continue;
      const k = monthKey(e.occurredAt);
      if (!incomeByMonth.has(k)) continue;
      incomeByMonth.set(
        k,
        incomeByMonth.get(k)! + toBase(e.amount, e.currency, ctx.rates, ctx.baseCurrency),
      );
    }

    const xs = histKeys.map((_, i) => i);
    const ys = histKeys.map((k) => incomeByMonth.get(k)!);
    const usable = ys.some((v) => v > 0) ? ys : ys.map(() => 0);
    const safeDegree = Math.min(degree, Math.max(1, xs.length - 1));
    const coeffs = regress(xs, usable, safeDegree);
    const preds = xs.map((x) => polyEval(coeffs, x));
    const rsq = rsquared(usable, preds);

    const series: { month: string; actual: number | null; forecast: number }[] = histKeys.map((k, i) => ({
      month: k,
      actual: usable[i]!,
      forecast: Math.max(0, preds[i]!),
    }));
    for (let i = 1; i <= horizon; i++) {
      const x = xs.length - 1 + i;
      series.push({
        month: shiftMonth(start, i),
        actual: null,
        forecast: Math.max(0, polyEval(coeffs, x)),
      });
    }

    // Months to target via linear regression
    const linear = regress(xs, usable, 1);
    let monthsToTarget: number | null = null;
    const slope = linear[1] ?? 0;
    const intercept = linear[0] ?? 0;
    if (slope > 0) {
      const xTarget = (ctx.monthlyTarget - intercept) / slope;
      const delta = xTarget - (xs.length - 1);
      monthsToTarget = delta > 0 ? Math.ceil(delta) : 0;
    }

    res.json({
      baseCurrency: ctx.baseCurrency,
      degree: safeDegree,
      coefficients: coeffs,
      rsquared: rsq,
      monthsToTarget,
      monthlyTarget: ctx.monthlyTarget,
      series,
    });
  } catch (e) { next(e); }
});

export default router;
