ALTER TABLE "Expense" RENAME COLUMN "recurringTemplateId" TO "recurringId";

ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_recurringTemplateId_fkey";
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurringId_fkey"
  FOREIGN KEY ("recurringId") REFERENCES "RecurringExpense"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "Expense_recurringTemplateId_createdAt_idx";
DROP INDEX IF EXISTS "Expense_recurringTemplateId_createdAt_key";
CREATE INDEX "Expense_recurringId_createdAt_idx" ON "Expense"("recurringId", "createdAt");

ALTER TABLE "RecurringExpense" DROP CONSTRAINT IF EXISTS "RecurringExpense_expenseId_fkey";
DROP INDEX IF EXISTS "RecurringExpense_expenseId_key";
ALTER TABLE "RecurringExpense" DROP COLUMN IF EXISTS "expenseId";
