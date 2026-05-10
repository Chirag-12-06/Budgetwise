import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const row = await prisma.recurringExpense.findFirst({
      orderBy: { id: 'desc' },
      take: 1,
    });

    console.log(JSON.stringify(row, null, 2));
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
