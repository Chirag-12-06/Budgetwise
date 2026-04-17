-- AlterTable
ALTER TABLE "Expense"
  ADD COLUMN "recurrenceFrequency" TEXT,
  ADD COLUMN "recurrenceEndDate" TIMESTAMP(3),
  ADD COLUMN "nextRecurrenceDate" TIMESTAMP(3),
  ADD COLUMN "isRecurringTemplate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recurringParentId" INTEGER;

-- CreateIndex
CREATE INDEX "Expense_recurringParentId_createdAt_idx" ON "Expense"("recurringParentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_recurringParentId_createdAt_key" ON "Expense"("recurringParentId", "createdAt");

-- AddForeignKey
ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_recurringParentId_fkey"
  FOREIGN KEY ("recurringParentId") REFERENCES "Expense"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
