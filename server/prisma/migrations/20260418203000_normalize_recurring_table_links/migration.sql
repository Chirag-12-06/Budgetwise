-- Link recurring templates to base expense instead of user
ALTER TABLE "RecurringExpense" ADD COLUMN "expenseId" INTEGER;

UPDATE "RecurringExpense" r
SET "expenseId" = e."id"
FROM "Expense" e
WHERE e."recurringTemplateId" = r."id";

ALTER TABLE "RecurringExpense"
  ALTER COLUMN "expenseId" SET NOT NULL;

CREATE UNIQUE INDEX "RecurringExpense_expenseId_key" ON "RecurringExpense"("expenseId");

ALTER TABLE "RecurringExpense"
  ADD CONSTRAINT "RecurringExpense_expenseId_fkey"
  FOREIGN KEY ("expenseId") REFERENCES "Expense"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "RecurringExpense_userId_nextRecurrenceDate_idx";
DROP INDEX IF EXISTS "Expense_recurringParentId_createdAt_idx";
DROP INDEX IF EXISTS "Expense_recurringParentId_createdAt_key";

ALTER TABLE "RecurringExpense" DROP CONSTRAINT IF EXISTS "RecurringExpense_userId_fkey";

ALTER TABLE "RecurringExpense" DROP COLUMN IF EXISTS "userId";

ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_recurringParentId_fkey";

ALTER TABLE "Expense"
  DROP COLUMN IF EXISTS "recurrenceFrequency",
  DROP COLUMN IF EXISTS "recurrenceEndDate",
  DROP COLUMN IF EXISTS "nextRecurrenceDate",
  DROP COLUMN IF EXISTS "recurrenceWeeklyDays",
  DROP COLUMN IF EXISTS "recurrenceDuration",
  DROP COLUMN IF EXISTS "recurrenceCount",
  DROP COLUMN IF EXISTS "recurrenceMonthlyPattern",
  DROP COLUMN IF EXISTS "recurrenceYearlyPattern",
  DROP COLUMN IF EXISTS "isRecurringTemplate",
  DROP COLUMN IF EXISTS "recurringParentId";