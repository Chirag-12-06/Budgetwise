import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, getCategoryDisplay } from "../lib/categoryConfig";
import Button from "../components/button";
import ExpenseFilterPanel from "../components/expenseFilterPanel";
import PanelCard from "../components/panelCard";
import { formatDateDMY } from "../utils/date";

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
  categoryFilterExpenses,
  selectedCategoryFilters,
  onCategoryFilterToggle,
  onClearCategoryFilters,
}) {
  return (
    <section className="grid gap-4">
      <PanelCard>
        <ExpenseFilterPanel
          className="grid gap-4"
          expenses={expenses}
          categoryFilterExpenses={categoryFilterExpenses}
          dateFilterMode={dateFilterMode}
          onDateFilterModeChange={setDateFilterMode}
          customDateFrom={customDateFrom}
          onCustomDateFromChange={setCustomDateFrom}
          customDateTo={customDateTo}
          onCustomDateToChange={setCustomDateTo}
          onApplyDateRange={applyCustomDateRange}
          dateRangeError={dateRangeError}
          selectedCategoryFilters={selectedCategoryFilters}
          onCategoryFilterToggle={onCategoryFilterToggle}
          onClearCategoryFilters={onClearCategoryFilters}
          summaryExpenses={filteredExpenses}
        />
      </PanelCard>

      <PanelCard>
        {filteredExpenses.length ? (
          <div className="grid gap-3.5">
            {filteredExpenses.map((expense) => {
              const category = getCategoryDisplay(expense.category);
              const color = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.uncategorized;
              return (
                <article
                  className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5 border-b border-gray-200 py-3.5 last:border-b-0 dark:border-slate-400/20"
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
                      {formatDateDMY(expense.createdAt)}
                    </span>
                  </div>
                  <div className="font-bold">{formatCurrency(expense.amount)}</div>
                  <div className="flex items-center gap-3">
                    <Button
                      aria-label={`Edit ${expense.title}`}
                      title="Edit expense"
                      variant="expenseEdit"
                      onClick={() => handleStartEditExpense(expense)}
                    >
                      <i className="fas fa-pen" aria-hidden="true" />
                    </Button>
                    <Button
                      aria-label={`Delete ${expense.title}`}
                      title="Delete expense"
                      variant="expenseDelete"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <i className="fas fa-trash" aria-hidden="true" />
                    </Button>
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
        </PanelCard>
    </section>
  );
}
