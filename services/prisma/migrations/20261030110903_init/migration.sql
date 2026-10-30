-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "expenses";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "recurring";

-- CreateEnum
CREATE TYPE "expenses"."TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "expenses"."BudgetPeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "recurring"."RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "recurring"."RecurrenceEndType" AS ENUM ('FOREVER', 'COUNT', 'UNTIL_DATE');

-- CreateEnum
CREATE TYPE "recurring"."OccurrenceStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED', 'FAILED');

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."user_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reporting_currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "time_zone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    "date_format" VARCHAR(30) NOT NULL DEFAULT 'DD/MM/YYYY',
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses"."transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" VARCHAR(50) NOT NULL,
    "type" "expenses"."TransactionType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "transaction_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses"."budget_categories_groups" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) NOT NULL,

    CONSTRAINT "budget_categories_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses"."expense_categories" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "group_id" VARCHAR(50) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses"."budget_categories" (
    "budget_id" UUID NOT NULL,
    "category_id" VARCHAR(50) NOT NULL,

    CONSTRAINT "budget_categories_pkey" PRIMARY KEY ("budget_id","category_id")
);

-- CreateTable
CREATE TABLE "expenses"."budgets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "period" "expenses"."BudgetPeriod" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring"."recurring_expenses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "category_id" VARCHAR(50) NOT NULL,
    "type" "expenses"."TransactionType" NOT NULL,
    "frequency" "recurring"."RecurrenceFrequency" NOT NULL,
    "interval_value" INTEGER NOT NULL DEFAULT 1,
    "start_date" DATE NOT NULL,
    "end_type" "recurring"."RecurrenceEndType" NOT NULL,
    "end_count" INTEGER,
    "end_date" TIMESTAMP(3),
    "occurrences_done" INTEGER NOT NULL DEFAULT 0,
    "next_due_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring"."recurring_occurrences" (
    "id" UUID NOT NULL,
    "recurring_expense_id" UUID NOT NULL,
    "transaction_id" UUID,
    "scheduled_date" DATE NOT NULL,
    "status" "recurring"."OccurrenceStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recurring_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "auth"."password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "auth"."password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "auth"."password_reset_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "auth"."user_preferences"("user_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_transaction_date_idx" ON "expenses"."transactions"("user_id", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_user_id_type_transaction_date_idx" ON "expenses"."transactions"("user_id", "type", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_category_id_idx" ON "expenses"."transactions"("category_id");

-- CreateIndex
CREATE INDEX "budget_categories_category_id_idx" ON "expenses"."budget_categories"("category_id");

-- CreateIndex
CREATE INDEX "budgets_user_id_is_active_idx" ON "expenses"."budgets"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "budgets_user_id_start_date_end_date_idx" ON "expenses"."budgets"("user_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "recurring_expenses_next_due_date_idx" ON "recurring"."recurring_expenses"("next_due_date");

-- CreateIndex
CREATE INDEX "recurring_expenses_user_id_is_active_idx" ON "recurring"."recurring_expenses"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "recurring_occurrences_scheduled_date_status_idx" ON "recurring"."recurring_occurrences"("scheduled_date", "status");

-- CreateIndex
CREATE INDEX "recurring_occurrences_transaction_id_idx" ON "recurring"."recurring_occurrences"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_occurrences_recurring_expense_id_scheduled_date_key" ON "recurring"."recurring_occurrences"("recurring_expense_id", "scheduled_date");

-- AddForeignKey
ALTER TABLE "auth"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses"."transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expenses"."expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses"."expense_categories" ADD CONSTRAINT "expense_categories_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "expenses"."budget_categories_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses"."budget_categories" ADD CONSTRAINT "budget_categories_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "expenses"."budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses"."budget_categories" ADD CONSTRAINT "budget_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expenses"."expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring"."recurring_occurrences" ADD CONSTRAINT "recurring_occurrences_recurring_expense_id_fkey" FOREIGN KEY ("recurring_expense_id") REFERENCES "recurring"."recurring_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
