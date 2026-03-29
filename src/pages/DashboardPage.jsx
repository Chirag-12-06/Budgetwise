import { CATEGORY_OPTIONS } from "../lib/categoryConfig";

const shellClasses =
  "rounded-2xl bg-slate-800/95 p-5 shadow-lg ring-1 ring-white/5 md:p-6";
const fieldClasses =
  "h-13 w-full rounded-xl border border-slate-600 bg-slate-700/80 px-4 text-lg text-white placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none";
const dateFieldClasses = `${fieldClasses} min-h-[3.25rem]`;
const submitButtonClasses =
  "w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-center text-xl font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-70";
const scanButtonClasses =
  "inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-lg font-medium text-white transition-colors hover:bg-indigo-500";

export default function DashboardPage({
  expenseForm,
  setExpenseForm,
  handleAddExpense,
  submitting,
}) {
  return (
    <section className={`${shellClasses} mx-auto w-full max-w-[760px]`}>
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-white md:text-3xl">Add New Expense</h2>
        <button className={scanButtonClasses} type="button">
          <i className="fas fa-camera" aria-hidden="true" />
          <span>Scan Receipt</span>
        </button>
      </div>

      <form className="grid gap-7" onSubmit={handleAddExpense}>
        <div className="grid gap-4 md:grid-cols-[16rem_minmax(0,1fr)]">
          <label className="relative">
            <i className="fas fa-tags pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-white" aria-hidden="true" />
            <select
              className={`${fieldClasses} appearance-none pl-12`}
              value={expenseForm.category}
              onChange={(event) =>
                setExpenseForm((current) => ({ ...current, category: event.target.value }))
              }
              required
            >
              <option value="" disabled>
                Category
              </option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <input
            className={fieldClasses}
            type="text"
            value={expenseForm.title}
            onChange={(event) =>
              setExpenseForm((current) => ({ ...current, title: event.target.value }))
            }
            required
            placeholder="Title"
          />
        </div>

        <input
          className={fieldClasses}
          type="number"
          min="0"
          step="0.01"
          value={expenseForm.amount}
          onChange={(event) =>
            setExpenseForm((current) => ({ ...current, amount: event.target.value }))
          }
          required
          placeholder="Amount"
        />

        <input
          className={dateFieldClasses}
          type="date"
          value={expenseForm.date}
          onChange={(event) =>
            setExpenseForm((current) => ({ ...current, date: event.target.value }))
          }
        />

        <button className={submitButtonClasses} type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Add Expense"}
        </button>
      </form>
    </section>
  );
}
