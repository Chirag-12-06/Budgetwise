
import { useMemo } from "react";
import { formatDateKey } from "../../utils/date";

export default function useExpenseFilters({
  expenses,
  activeDateRange,
  selectedCategoryFilters,
}) {
  const dateFilteredExpenses = useMemo(() => {
    if (!activeDateRange) return [];

    const { from, to } = activeDateRange;

    return expenses
      .filter((expense) => {
        const expenseDate = formatDateKey(
          expense.date || expense.createdAt,
        );

        if (from && expenseDate < from) return false;
        if (to && expenseDate > to) return false;

        return true;
      })
      .sort(
        (left, right) =>
          new Date(right.createdAt) - new Date(left.createdAt),
      );
  }, [expenses, activeDateRange]);

  const filteredExpenses = useMemo(() => {
    if (selectedCategoryFilters.length === 0) {
      return dateFilteredExpenses;
    }

    return dateFilteredExpenses.filter((expense) =>
      selectedCategoryFilters.includes(
        expense.category || "uncategorized",
      ),
    );
  }, [dateFilteredExpenses, selectedCategoryFilters]);

  const emptyFilteredState =
    filteredExpenses.length === 0 && expenses.length > 0;

  return {
    dateFilteredExpenses,
    filteredExpenses,
    emptyFilteredState,
  };
}
