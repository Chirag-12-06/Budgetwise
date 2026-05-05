CREATE OR REPLACE FUNCTION "delete_orphan_recurring_expense"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD."recurringId" IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM "Expense" e
      WHERE e."recurringId" = OLD."recurringId"
    ) THEN
      DELETE FROM "RecurringExpense"
      WHERE "id" = OLD."recurringId";
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS "trg_delete_orphan_recurring_on_expense_delete" ON "Expense";
CREATE TRIGGER "trg_delete_orphan_recurring_on_expense_delete"
AFTER DELETE ON "Expense"
FOR EACH ROW
WHEN (OLD."recurringId" IS NOT NULL)
EXECUTE FUNCTION "delete_orphan_recurring_expense"();

DROP TRIGGER IF EXISTS "trg_delete_orphan_recurring_on_expense_update" ON "Expense";
CREATE TRIGGER "trg_delete_orphan_recurring_on_expense_update"
AFTER UPDATE OF "recurringId" ON "Expense"
FOR EACH ROW
WHEN (OLD."recurringId" IS DISTINCT FROM NEW."recurringId" AND OLD."recurringId" IS NOT NULL)
EXECUTE FUNCTION "delete_orphan_recurring_expense"();
