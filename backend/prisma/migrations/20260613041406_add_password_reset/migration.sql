-- AlterTable
ALTER TABLE "RecurringExpense" RENAME CONSTRAINT "RecurringExpense_pkey" TO "recurring_expenses_pkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetExpiry" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- RenameForeignKey
ALTER TABLE "RecurringExpense" RENAME CONSTRAINT "RecurringExpense_user_id_fkey" TO "recurring_expenses_user_id_fkey";

-- RenameIndex
ALTER INDEX "RecurringExpense_next_due_date_idx" RENAME TO "recurring_expenses_next_due_date_idx";

-- RenameIndex
ALTER INDEX "RecurringExpense_user_id_is_active_idx" RENAME TO "recurring_expenses_user_id_is_active_idx";
