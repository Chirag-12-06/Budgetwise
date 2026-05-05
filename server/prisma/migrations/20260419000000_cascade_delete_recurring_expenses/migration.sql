ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_recurringId_fkey";

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_recurringId_fkey"
  FOREIGN KEY ("recurringId") REFERENCES "RecurringExpense"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
