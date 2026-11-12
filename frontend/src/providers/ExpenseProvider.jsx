import { useEffect, useRef } from "react";

import ExpenseContext from "../context/ExpenseContext";

import useExpenseCrud from "../hooks/expenses/useExpenseCrud";
import useExpenseForm from "../hooks/expenses/useExpenseForm";
import useDateFilters from "../hooks/filters/useDateFilters";
import useCategoryFilters from "../hooks/filters/useCategoryFilters";
import useExpenseFilters from "../hooks/filters/useExpenseFilters";

export default function ExpenseProvider({
  children,
  user,
  authLoading,
  handleApiError,
  showStatus,
  clearStatus,
}) {
  const expenseForm = useExpenseForm();
  const dateFilters = useDateFilters();
  const categoryFilters = useCategoryFilters();

  const expenseCrud = useExpenseCrud({
    user,
    handleApiError,
    showStatus,
    clearStatus,
    activeDateRange: dateFilters.activeDateRange,
  });

  const expenseFilters = useExpenseFilters({
    expenses: expenseCrud.expenses,
    activeDateRange: dateFilters.activeDateRange,
    selectedCategoryFilters: categoryFilters.selectedCategoryFilters,
  });

  // Keep the latest callbacks without triggering effects on every render.
  const actionsRef = useRef({});

  actionsRef.current = {
    refreshExpenses: expenseCrud.refreshExpenses,
    handleApiError,
    setExpenses: expenseCrud.setExpenses,
    handleCancelEditExpense: expenseForm.handleCancelEditExpense,
    clearCategoryFilters: categoryFilters.clearCategoryFilters,
    resetDateFilters: dateFilters.resetDateFilters,
  };

  // Fetch expenses after authentication and whenever the date range changes.
  useEffect(() => {
    if (authLoading || !user || !dateFilters.activeDateRange) {
      return;
    }

    let ignore = false;

    async function loadExpenses() {
      try {
        await actionsRef.current.refreshExpenses(dateFilters.activeDateRange);
      } catch (error) {
        if (!ignore) {
          actionsRef.current.handleApiError(error, "Unable to load expenses");
        }
      }
    }

    loadExpenses();

    return () => {
      ignore = true;
    };
  }, [user, authLoading, dateFilters.activeDateRange]);

  // Clear expense state after logout.
  useEffect(() => {
    if (authLoading || user) return;

    actionsRef.current.setExpenses([]);
    actionsRef.current.handleCancelEditExpense();
    actionsRef.current.clearCategoryFilters();
    actionsRef.current.resetDateFilters();
  }, [user, authLoading]);

  function handleStartEditExpense(expense) {
    clearStatus();
    expenseForm.handleStartEditExpense(expense);
  }

  async function handleAddExpense(event) {
    event.preventDefault();

    try {
      await expenseCrud.saveExpense(
        expenseForm.expenseForm,
        expenseForm.editingExpenseId,
      );

      expenseForm.handleCancelEditExpense();
    } catch {
      // Error is already handled by useExpenseCrud.
    }
  }

  async function handleDeleteExpense(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?",
    );

    if (!confirmed) return;

    await expenseCrud.deleteExpense(id);
  }

  function handleTrendPointDateSelect(point) {
    if (!point) return;

    let from;
    let to;

    if (point.dateKey) {
      from = point.dateKey;
      to = point.dateKey;
    } else if (point.rangeFrom && point.rangeTo) {
      from = point.rangeFrom;
      to = point.rangeTo;
    } else {
      return;
    }

    categoryFilters.clearCategoryFilters();
    dateFilters.activateCustomDateRange(from, to);
  }

  const value = {
    // Expense data and API state
    ...expenseCrud,

    // Form state
    ...expenseForm,

    // Date filters
    ...dateFilters,

    // Category filters
    ...categoryFilters,

    // Derived expense lists
    ...expenseFilters,

    // Expense actions
    handleAddExpense,
    handleStartEditExpense,
    handleDeleteExpense,
    handleTrendPointDateSelect,

    // Compatibility with existing page prop names
    handleCategoryFilterToggle: categoryFilters.toggleCategoryFilter,

    // Editing status
    isEditingExpense: expenseForm.editingExpenseId !== null,
  };

  return (
    <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
  );
}
