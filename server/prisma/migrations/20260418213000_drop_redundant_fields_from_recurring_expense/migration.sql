ALTER TABLE "RecurringExpense"
  DROP COLUMN IF EXISTS "title",
  DROP COLUMN IF EXISTS "amount",
  DROP COLUMN IF EXISTS "category";
