import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, getCategoryDisplay } from "../lib/categoryConfig";

const panelCardClasses =
  "rounded-[22px] border border-slate-400/20 bg-white/60 p-4 dark:bg-slate-950/50";
const baseTabClasses =
  "rounded-full border border-slate-400/35 px-4 py-2.5 font-semibold text-inherit transition-colors";
const activeTabClasses = "border-blue-600 bg-blue-600 text-white";
const inactiveTabClasses = "bg-transparent hover:bg-slate-400/10";
const inputClasses =
  "w-full rounded-[14px] border border-slate-400/35 bg-white/70 px-4 py-3.5 text-inherit dark:bg-slate-950/45";

export default function ExpensesPage({
  dateFilterMode,
  setDateFilterMode,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
  applyCustomDateRange,
  filteredExpenses,
  loadingExpenses,
  emptyFilteredState,
  handleDeleteExpense,
}) {
  return (
    <section className={panelCardClasses}>
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
        <div>
          <h3>All Expenses</h3>
          <p className="text-slate-500 dark:text-slate-300">
            The first React version of your expense history screen.
          </p>
        </div>
      </div>
      <div className="mb-5 grid gap-4">
        <div className="flex flex-wrap gap-3">
          <button
            className={`${baseTabClasses} ${dateFilterMode === "allTime" ? activeTabClasses : inactiveTabClasses}`}
            type="button"
            onClick={() => setDateFilterMode("allTime")}
          >
            All Time
          </button>
          <button
            className={`${baseTabClasses} ${dateFilterMode === "thisMonth" ? activeTabClasses : inactiveTabClasses}`}
            type="button"
            onClick={() => setDateFilterMode("thisMonth")}
          >
            This Month
          </button>
          <button
            className={`${baseTabClasses} ${dateFilterMode === "lastMonth" ? activeTabClasses : inactiveTabClasses}`}
            type="button"
            onClick={() => setDateFilterMode("lastMonth")}
          >
            Last Month
          </button>
          <button
            className={`${baseTabClasses} ${dateFilterMode === "thisYear" ? activeTabClasses : inactiveTabClasses}`}
            type="button"
            onClick={() => setDateFilterMode("thisYear")}
          >
            This Year
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold">From</span>
            <input
              className={inputClasses}
              type="date"
              value={customDateFrom}
              onChange={(event) => setCustomDateFrom(event.target.value)}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold">To</span>
            <input
              className={inputClasses}
              type="date"
              value={customDateTo}
              onChange={(event) => setCustomDateTo(event.target.value)}
            />
          </label>
          <button
            className="rounded-2xl border border-slate-400/35 bg-transparent px-4 py-4 font-bold text-inherit"
            type="button"
            onClick={applyCustomDateRange}
          >
            Apply
          </button>
        </div>
      </div>

      {filteredExpenses.length ? (
        <div className="grid gap-3.5">
          {filteredExpenses.map((expense) => {
            const category = getCategoryDisplay(expense.category);
            const color = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.uncategorized;
            return (
              <article
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5 border-b border-slate-400/20 py-3.5 last:border-b-0 max-sm:grid-cols-1"
                key={expense.id}
              >
                <div
                  className="h-3.5 w-3.5 rounded-full shadow-[0_0_0_6px_rgba(148,163,184,0.1)]"
                  style={{ backgroundColor: color }}
                />
                <div className="grid gap-1">
                  <strong>{expense.title}</strong>
                  <span className="text-[0.92rem] text-slate-500 dark:text-slate-300">
                    {category.label} •{" "}
                    {new Date(expense.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="font-bold">{formatCurrency(expense.amount)}</div>
                <div className="flex items-center gap-3 max-sm:w-full max-sm:flex-wrap">
                  <button
                    className="rounded-2xl border border-red-700/30 bg-transparent px-4 py-4 font-bold text-red-700"
                    type="button"
                    onClick={() => handleDeleteExpense(expense.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-slate-500 dark:text-slate-300">
          {loadingExpenses
            ? "Loading expenses..."
            : emptyFilteredState
              ? "No expenses in the selected date range."
              : "No expenses yet. Add your first one from the dashboard."}
        </div>
      )}
    </section>
  );
}
