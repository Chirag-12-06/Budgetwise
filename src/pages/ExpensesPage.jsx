import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, getCategoryDisplay } from "../lib/categoryConfig";
import Button from "../components/button";

const panelCardClasses =
  "rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800";
const inputClasses =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white";

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
      </div>
      <div className="mb-5 grid gap-4">
        <div className="flex flex-wrap gap-3">
          <Button
            active={dateFilterMode === "allTime"}
            onClick={() => setDateFilterMode("allTime")}
          >
            All Time
          </Button>
          <Button
            active={dateFilterMode === "thisMonth"}
            onClick={() => setDateFilterMode("thisMonth")}
          >
            This Month
          </Button>
          <Button
            active={dateFilterMode === "lastMonth"}
            onClick={() => setDateFilterMode("lastMonth")}
          >
            Last Month
          </Button>
          <Button
            active={dateFilterMode === "thisYear"}
            onClick={() => setDateFilterMode("thisYear")}
          >
            This Year
          </Button>
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
          <Button variant="outline" onClick={applyCustomDateRange}>
            Apply
          </Button>
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
                  <span className="text-[0.92rem] text-gray-500 dark:text-gray-300">
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
                    className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
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
        <div className="py-6 text-gray-500 dark:text-gray-300">
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
