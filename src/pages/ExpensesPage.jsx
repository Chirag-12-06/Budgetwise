import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, getCategoryDisplay } from "../lib/categoryConfig";
import Button from "../components/button";
import Calendar from "../components/calendar";
import { formatDateDMY } from "../utils/date";

const panelCardClasses =
  "rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800";

export default function ExpensesPage({
  expenses,
  dateFilterMode,
  setDateFilterMode,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
  applyCustomDateRange,
  dateRangeError,
  filteredExpenses,
  loadingExpenses,
  emptyFilteredState,
  handleStartEditExpense,
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
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold">From</span>
            <Calendar
              expenses={expenses}
              value={customDateFrom}
              onChange={(event) => setCustomDateFrom(event.target.value)}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold">To</span>
            <Calendar
              expenses={expenses}
              value={customDateTo}
              onChange={(event) => setCustomDateTo(event.target.value)}
            />
          </label>
          <Button className="self-end" variant="outline" onClick={applyCustomDateRange}>
            Apply
          </Button>
        </div>
        {dateRangeError ? (
          <p className="text-sm font-semibold text-red-600 dark:text-red-300">
            {dateRangeError}
          </p>
        ) : null}
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
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  <i className={category.icon} aria-hidden="true" />
                </span>
                <div className="grid gap-1">
                  <strong>{expense.title}</strong>
                  <span className="text-[0.92rem] text-gray-500 dark:text-gray-300">
                    {category.label} •{" "}
                    {formatDateDMY(expense.createdAt)}
                  </span>
                </div>
                <div className="font-bold">{formatCurrency(expense.amount)}</div>
                <div className="flex items-center gap-3 max-sm:w-full max-sm:flex-wrap">
                  <button
                    aria-label={`Edit ${expense.title}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-white transition-colors hover:bg-emerald-500"
                    title="Edit expense"
                    type="button"
                    onClick={() => handleStartEditExpense(expense)}
                  >
                    <i className="fas fa-pen" aria-hidden="true" />
                  </button>
                  <button
                    aria-label={`Delete ${expense.title}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-red-500 text-white transition-colors hover:bg-red-600"
                    title="Delete expense"
                    type="button"
                    onClick={() => handleDeleteExpense(expense.id)}
                  >
                    <i className="fas fa-trash" aria-hidden="true" />
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
