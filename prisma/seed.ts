import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.goals.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      baseCurrency: "EUR",
      monthlyTarget: "1000000",
      reinvestPct: 40,
      expensePct: 30,
      savingsPct: 30,
    },
  });

  const fx = [
    { currency: "EUR", rateToBase: "1" },
    { currency: "USD", rateToBase: "0.92" },
    { currency: "GBP", rateToBase: "1.18" },
    { currency: "CAD", rateToBase: "0.68" },
    { currency: "CHF", rateToBase: "1.05" },
    { currency: "MGA", rateToBase: "0.000208" },
    { currency: "XOF", rateToBase: "0.001524" },
  ];
  for (const r of fx) {
    await prisma.fxRate.upsert({
      where: { currency: r.currency },
      update: { rateToBase: r.rateToBase },
      create: r,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
