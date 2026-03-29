import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, CATEGORY_OPTIONS, getCategoryDisplay } from "../lib/categoryConfig";

const panelCardClasses =
  "rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800";
const inputClasses =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white";
const primaryButtonClasses =
  "rounded-md border-0 bg-indigo-600 px-4 py-2 font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70";

export default function DashboardPage({
  totalSpent,
  monthSpent,
  expenses,
  latestExpenses,
  loadingExpenses,
  expenseForm,
  setExpenseForm,
  handleAddExpense,
  submitting,
}) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
            <div>
              <h3>Add Expense</h3>
            </div>
          </div>
          <form className="grid gap-4" onSubmit={handleAddExpense}>
            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold">Title</span>
              <input
                className={inputClasses}
                type="text"
                value={expenseForm.title}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, title: event.target.value }))
                }
                required
                placeholder="Dinner with friends"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold">Amount</span>
              <input
                className={inputClasses}
                type="number"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, amount: event.target.value }))
                }
                required
                placeholder="450"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold">Category</span>
              <select
                className={inputClasses}
                value={expenseForm.category}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, category: event.target.value }))
                }
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold">Date</span>
              <input
                className={inputClasses}
                type="date"
                value={expenseForm.date}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, date: event.target.value }))
                }
              />
            </label>
            <button className={primaryButtonClasses} type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Add Expense"}
            </button>
          </form>
      </div>
      
    </>
  );
}
