-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "RecurrenceEndType" AS ENUM ('forever', 'count', 'until_date');

-- CreateTable
CREATE TABLE "recurring_expenses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "interval_value" INTEGER NOT NULL DEFAULT 1,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_type" "RecurrenceEndType" NOT NULL,
    "end_count" INTEGER,
    "end_date" TIMESTAMP(3),
    "occurrences_done" INTEGER NOT NULL DEFAULT 0,
    "next_due_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_expenses_user_id_is_active_idx" ON "recurring_expenses"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "recurring_expenses_next_due_date_idx" ON "recurring_expenses"("next_due_date");

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
