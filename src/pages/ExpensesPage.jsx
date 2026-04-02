import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, getCategoryDisplay } from "../lib/categoryConfig";
import DateFilterPanel from "../components/dateFilterPanel";
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
      <DateFilterPanel
        expenses={expenses}
        dateFilterMode={dateFilterMode}
        onDateFilterModeChange={setDateFilterMode}
        customDateFrom={customDateFrom}
        onCustomDateFromChange={setCustomDateFrom}
        customDateTo={customDateTo}
        onCustomDateToChange={setCustomDateTo}
        onApplyDateRange={applyCustomDateRange}
        dateRangeError={dateRangeError}
        summaryExpenses={filteredExpenses}
      />

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
