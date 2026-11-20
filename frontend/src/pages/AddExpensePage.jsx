import ReceiptDialog from "../components/receipt/ReceiptDialog";
import { Button, Calendar, PanelCard } from "../components/ui";
import { CategorySelector, CurrencySelector } from "../components/expense-form";

import useReceiptScanner from "../hooks/receipt/useReceiptScanner";
import useExpenses from "../hooks/expenses/useExpenses";

const fieldClasses =
  "h-13 w-full rounded-xl border border-gray-300 bg-white px-4 text-lg text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700/80 dark:text-white dark:placeholder:text-slate-300";

const submitButtonClasses =
  "w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-center text-xl font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-70";

const updateButtonClasses =
  "w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-center text-xl font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-70";

const cancelButtonClasses =
  "w-full rounded-xl bg-red-600 px-4 py-3.5 text-center text-xl font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70";

const scanButtonClasses =
  "inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-lg font-medium text-white transition-colors hover:bg-indigo-500";

export default function AddExpensePage() {
  const {
    expenses,
    expenseForm,
    setExpenseForm,
    handleAddExpense,
    submitting,
    isEditingExpense,
    handleCancelEditExpense,
  } = useExpenses();

  const { fileInputRef, handleReceiptScan, isScanning } = useReceiptScanner({
    setExpenseForm,
  });

  return (
    <PanelCard variant="addExpense" className="mx-auto w-full max-w-190">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
          {isEditingExpense ? "Edit Expense" : "Add New Expense"}
        </h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleReceiptScan}
        />

        <Button
          variant="plain"
          className={scanButtonClasses}
          type="button"
          disabled={isScanning}
          onClick={() => fileInputRef.current?.click()}
        >
          <i className="fas fa-camera" aria-hidden="true" />
          <span>{isScanning ? "Scanning..." : "Scan Receipt"}</span>
        </Button>
      </div>

      <ReceiptDialog />

      <form className="grid gap-7" onSubmit={handleAddExpense}>
        <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
          <CategorySelector expenseForm={expenseForm} />

          <input
            className={`${fieldClasses} self-end`}
            type="text"
            value={expenseForm.title}
            onChange={(event) =>
              setExpenseForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            required
            placeholder="Title"
          />
        </div>

        <div className="flex gap-2">
          <CurrencySelector
            expenseForm={expenseForm}
            setExpenseForm={setExpenseForm}
            fieldClasses={fieldClasses}
          />

          <input
            className={`${fieldClasses} min-w-0 flex-1`}
            type="number"
            min="0"
            step="0.01"
            value={expenseForm.amount}
            onChange={(event) =>
              setExpenseForm((current) => ({
                ...current,
                amount: event.target.value,
              }))
            }
            required
            placeholder="Amount"
          />
        </div>

        <Calendar
          className="min-h-13 rounded-xl border border-gray-300 bg-white px-4 text-lg text-gray-900 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-700/80 dark:text-white"
          expenses={expenses}
          value={expenseForm.date}
          onChange={(event) =>
            setExpenseForm((current) => ({
              ...current,
              date: event.target.value,
            }))
          }
        />

        {isEditingExpense ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="plain"
              className={updateButtonClasses}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Update Expense"}
            </Button>

            <Button
              variant="plain"
              className={cancelButtonClasses}
              type="button"
              onClick={handleCancelEditExpense}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="plain"
            className={submitButtonClasses}
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Add Expense"}
          </Button>
        )}
      </form>
    </PanelCard>
  );
}
