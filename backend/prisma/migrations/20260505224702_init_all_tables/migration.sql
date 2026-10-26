-- CreateEnum
CREATE TYPE "budgetwise_app"."RecurrenceFrequency" AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "budgetwise_app"."RecurrenceEndType" AS ENUM ('forever', 'count', 'until_date');

-- CreateTable
CREATE TABLE "budgetwise_app"."User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatarDataUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgetwise_app"."RecurringExpense" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "frequency" "budgetwise_app"."RecurrenceFrequency" NOT NULL,
    "interval_value" INTEGER NOT NULL DEFAULT 1,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_type" "budgetwise_app"."RecurrenceEndType" NOT NULL,
    "end_count" INTEGER,
    "end_date" TIMESTAMP(3),
    "occurrences_done" INTEGER NOT NULL DEFAULT 0,
    "next_due_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgetwise_app"."Expense" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "recurringId" INTEGER,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "budgetwise_app"."User"("email");

-- CreateIndex
CREATE INDEX "RecurringExpense_user_id_is_active_idx" ON "budgetwise_app"."RecurringExpense"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "RecurringExpense_next_due_date_idx" ON "budgetwise_app"."RecurringExpense"("next_due_date");

-- CreateIndex
CREATE INDEX "Expense_userId_createdAt_idx" ON "budgetwise_app"."Expense"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Expense_recurringId_idx" ON "budgetwise_app"."Expense"("recurringId");

-- AddForeignKey
ALTER TABLE "budgetwise_app"."RecurringExpense" ADD CONSTRAINT "RecurringExpense_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "budgetwise_app"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgetwise_app"."Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "budgetwise_app"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgetwise_app"."Expense" ADD CONSTRAINT "Expense_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "budgetwise_app"."RecurringExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
