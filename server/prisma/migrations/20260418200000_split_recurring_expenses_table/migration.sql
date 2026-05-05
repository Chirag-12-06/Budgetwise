CREATE TABLE "RecurringExpense" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "category" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "recurrenceFrequency" TEXT NOT NULL,
  "recurrenceEndDate" TIMESTAMP(3) NOT NULL,
  "nextRecurrenceDate" TIMESTAMP(3),
  "recurrenceWeeklyDays" TEXT,
  "recurrenceDuration" TEXT,
  "recurrenceCount" TEXT,
  "recurrenceMonthlyPattern" TEXT,
  "recurrenceYearlyPattern" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" INTEGER,

  CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Expense" ADD COLUMN "recurringTemplateId" INTEGER;

CREATE INDEX "RecurringExpense_userId_nextRecurrenceDate_idx"
  ON "RecurringExpense"("userId", "nextRecurrenceDate");

CREATE INDEX "Expense_recurringTemplateId_createdAt_idx"
  ON "Expense"("recurringTemplateId", "createdAt");

CREATE UNIQUE INDEX "Expense_recurringTemplateId_createdAt_key"
  ON "Expense"("recurringTemplateId", "createdAt");

ALTER TABLE "RecurringExpense"
  ADD CONSTRAINT "RecurringExpense_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_recurringTemplateId_fkey"
  FOREIGN KEY ("recurringTemplateId") REFERENCES "RecurringExpense"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;