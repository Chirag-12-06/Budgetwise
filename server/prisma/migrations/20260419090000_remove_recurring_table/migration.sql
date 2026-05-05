DROP TRIGGER IF EXISTS "trg_delete_orphan_recurring_on_expense_delete" ON "Expense";
DROP TRIGGER IF EXISTS "trg_delete_orphan_recurring_on_expense_update" ON "Expense";
DROP FUNCTION IF EXISTS "delete_orphan_recurring_expense"();

ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_recurringId_fkey";
DROP INDEX IF EXISTS "Expense_recurringId_createdAt_idx";

ALTER TABLE "Expense" DROP COLUMN IF EXISTS "recurringId";

DROP TABLE IF EXISTS "RecurringExpense";
