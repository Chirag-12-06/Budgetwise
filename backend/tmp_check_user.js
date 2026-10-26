import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: "./.env" });

// Prisma v6 on some setups expects a datasource URL with the `prisma+postgres://` prefix.
// Normalize the env var at runtime to avoid client validation errors in this helper.
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgresql://")) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^postgresql:\/\//, "prisma+postgres://");
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({ select: { id: true, email: true, name: true } });
    console.log(JSON.stringify(user || null, null, 2));
  } catch (e) {
    console.error(e && e.stack ? e.stack : e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
