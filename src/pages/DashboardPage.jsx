import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, CATEGORY_OPTIONS, getCategoryDisplay } from "../lib/categoryConfig";

const panelCardClasses =
  "rounded-[22px] border border-slate-400/20 bg-white/60 p-4 dark:bg-slate-950/50";
const inputClasses =
  "w-full rounded-[14px] border border-slate-400/35 bg-white/70 px-4 py-3.5 text-inherit dark:bg-slate-950/45";
const primaryButtonClasses =
  "rounded-2xl border-0 bg-[linear-gradient(135deg,#2563eb_0%,#0f766e_100%)] px-4 py-4 font-bold text-white disabled:cursor-wait disabled:opacity-70";

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
      <div className="grid gap-4 lg:grid-cols-3">
        <article className={panelCardClasses}>
          <span className="mb-2 block text-slate-500 dark:text-slate-300">Total Expenses</span>
          <strong className="text-[1.3rem]">{formatCurrency(totalSpent)}</strong>
        </article>
        <article className={panelCardClasses}>
          <span className="mb-2 block text-slate-500 dark:text-slate-300">This Month</span>
          <strong className="text-[1.3rem]">{formatCurrency(monthSpent)}</strong>
        </article>
        <article className={panelCardClasses}>
          <span className="mb-2 block text-slate-500 dark:text-slate-300">Total Entries</span>
          <strong className="text-[1.3rem]">{expenses.length}</strong>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className={panelCardClasses}>
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
            <div>
              <h3>Add Expense</h3>
              <p className="text-slate-500 dark:text-slate-300">
                This is the first live form migrated from the vanilla app.
              </p>
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
        </section>

        <section className={panelCardClasses}>
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
            <div>
              <h3>Recent Expenses</h3>
              <p className="text-slate-500 dark:text-slate-300">
                {loadingExpenses ? "Loading from your backend..." : "Latest entries from your account."}
              </p>
            </div>
          </div>
          {latestExpenses.length ? (
            <div className="grid gap-3.5">
              {latestExpenses.map((expense) => {
                const category = getCategoryDisplay(expense.category);
                const color = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.uncategorized;
                return (
                  <article
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3.5 border-b border-slate-400/20 py-3.5 last:border-b-0 max-sm:grid-cols-1"
                    key={expense.id}
                  >
                    <div
                      className="h-3.5 w-3.5 rounded-full shadow-[0_0_0_6px_rgba(148,163,184,0.1)]"
                      style={{ backgroundColor: color }}
                    />
                    <div className="grid gap-1">
                      <strong>{expense.title}</strong>
                      <span className="text-[0.92rem] text-slate-500 dark:text-slate-300">
                        {category.label} • {new Date(expense.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <div className="font-bold">{formatCurrency(expense.amount)}</div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-slate-500 dark:text-slate-300">
              {loadingExpenses ? "Loading expenses..." : "No expenses yet. Add your first one here."}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
