import ExpenseFilterPanel from "../components/expenseFilterPanel";
import Button from "../components/ui/Button";
import PanelCard from "../components/ui/PanelCard";

import useCategory from "../hooks/useCategory";
import useExpenses from "../hooks/expenses/useExpenses";

import useFormattedCurrency from "../hooks/useFormattedCurrency";
import { formatDateDMY } from "../utils/date";

export default function ExpensesPage() {
  const {
    filteredExpenses,
    loadingExpenses,
    emptyFilteredState,
    handleStartEditExpense,
    handleDeleteExpense,
  } = useExpenses();

  const { categories } = useCategory();
  const formattedCurrency = useFormattedCurrency();

  return (
    <section className="grid gap-4">
      <PanelCard>
        <ExpenseFilterPanel className="grid gap-4" />
      </PanelCard>

      <PanelCard>
        {filteredExpenses.length ? (
          <div className="max-h-[52vh] min-h-48 overflow-y-auto grid gap-3.5">
            {filteredExpenses.map((expense) => {
              const category = categories.find(
                (item) => item.id === expense.category,
              );

              return (
                <article
                  className="grid gap-3.5 border-b border-gray-200 py-3.5 last:border-b-0 dark:border-slate-400/20"
                  key={expense.id}
                >
                  <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm"
                      style={{
                        backgroundColor: category?.color,
                      }}
                    >
                      <i className={category?.icon} aria-hidden="true" />
                    </span>

                    <div className="grid gap-1">
                      <strong>{expense.title}</strong>

                      <span className="text-[0.92rem] text-gray-500 dark:text-gray-300">
                        {formatDateDMY(expense.date || expense.createdAt)}
                      </span>
                    </div>

                    <div className="font-bold">
                      {formattedCurrency(expense.amount)}
                    </div>

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
                : "No expenses yet. Add your first one from the Add Expense page."}
          </div>
        )}
      </PanelCard>
    </section>
  );
}
