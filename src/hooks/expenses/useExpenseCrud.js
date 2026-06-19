import {
  createExpense,
  createRecurringExpense,
  fetchExpenses,
  getTodayDate,
  removeExpense,
  updateExpense,
  updateRecurringExpense,
} from "../../lib/api";
import { ROUTES } from "../../lib/routes";
import { formatDateKey } from "../../utils/date";
import {
  createDefaultExpenseForm,
  createDefaultRecurringForm,
} from "../../utils/defaultforms";

export default function useExpenseCrud({
  user,
  expenseForm,
  recurringForm,
  editingExpenseId,
  editingRecurringExpenseId,
  setEditingExpenseId,
  setEditingRecurringExpenseId,
  setExpenseForm,
  setRecurringForm,
  setExpenses,
  setSubmitting,
  setLoadingExpenses,
  handleApiError,
  showStatus,
  clearStatus,
  navigate,
  activeDateRange,
}) {

  async function refreshExpenses(options = activeDateRange) {
    if (!user) {
      return [];
    }

    setLoadingExpenses(true);

    try {
      const expensesData = await fetchExpenses(options);

      const expenses = Array.isArray(expensesData)
        ? expensesData.map((item) => ({
            ...item,
            isRecurring: Boolean(item.recurringId),
          }))
        : [];

      const sorted = [...expenses].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || a.startDate || 0);
        const dateB = new Date(b.createdAt || b.date || b.startDate || 0);

        return dateB - dateA;
      });

      setExpenses(sorted);
      return sorted;
    } finally {
      setLoadingExpenses(false);
    }
  }

  async function handleAddExpense(event) {
    event.preventDefault();

    if (
      recurringForm.enabled &&
      recurringForm.endType === "UNTIL_DATE" &&
      recurringForm.endDate &&
      expenseForm.date &&
      recurringForm.endDate <= expenseForm.date
    ) {
      showStatus("Until date must be after the start date.", "error");
      return;
    }

    setSubmitting(true);
    clearStatus();

    const payload = {
      title: expenseForm.title.trim(),
      amount: expenseForm.amount,
      category: expenseForm.category,
      date: expenseForm.date,
    };

    const recurringPayload = {
      title: expenseForm.title.trim(),
      amount: expenseForm.amount,
      category: expenseForm.category,
      frequency: recurringForm.frequency,
      intervalValue: recurringForm.intervalValue,
      startDate: expenseForm.date,
      endType: recurringForm.endType,
      endCount: recurringForm.endCount,
      endDate: recurringForm.endDate,
    };

    try {
      if (editingRecurringExpenseId !== null) {
        await updateRecurringExpense(
          editingRecurringExpenseId,
          recurringPayload,
        );
        await refreshExpenses(activeDateRange);
        showStatus("Recurring expense updated successfully", "success");
      } else if (editingExpenseId !== null) {
        const updatePayload =
          expenseForm.editScope === "future"
            ? { ...payload, scope: "future", recurring: recurringForm }
            : payload;
        await updateExpense(editingExpenseId, updatePayload);
        await refreshExpenses(activeDateRange);
        showStatus("Expense updated successfully", "success");
      } else if (recurringForm.enabled) {
        await createRecurringExpense(recurringPayload);
        await refreshExpenses(activeDateRange);
        showStatus("Recurring expense saved successfully", "success");
      } else {
        await createExpense(payload);
        await refreshExpenses(activeDateRange);
        showStatus("Expense added successfully", "success");
      }

      setExpenseForm((current) => createDefaultExpenseForm());
      setRecurringForm(createDefaultRecurringForm());
      setEditingExpenseId(null);
      setEditingRecurringExpenseId(null);
    } catch (error) {
      let errorMessage = "Unable to add expense";

      if (editingRecurringExpenseId !== null) {
        errorMessage = "Unable to update recurring expense";
      } else if (editingExpenseId !== null) {
        errorMessage = "Unable to update expense";
      }

      handleApiError(error, errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartEditExpense(expense) {
    const dateValue = expense?.createdAt
      ? formatDateKey(expense.createdAt)
      : getTodayDate();
    setEditingExpenseId(expense.id);
    setExpenseForm({
      title: expense.title || "",
      amount:
        expense.amount !== undefined && expense.amount !== null
          ? String(expense.amount)
          : "",
      category: expense.category || "",
      date: dateValue,
      editScope: null,
    });
    setRecurringForm(createDefaultRecurringForm());
    navigate(ROUTES.HOME);
    clearStatus();
  }

  function handleCancelEditExpense() {
    setEditingExpenseId(null);
    setEditingRecurringExpenseId(null);
    setExpenseForm(createDefaultExpenseForm());
    setRecurringForm(createDefaultRecurringForm());
  }

  async function handleDeleteExpense(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?",
    );
    if (!confirmed) return;
  }

  async function handleDeleteExpense(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?",
    );
    if (!confirmed) return;
    try {
      await removeExpense(id);
      await refreshExpenses(activeDateRange);
      if (id === editingExpenseId) {
        handleCancelEditExpense();
      }
      showStatus("Expense deleted successfully", "success");
    } catch (error) {
      handleApiError(error, "Failed to delete expense");
    }
  }
  return {
    refreshExpenses,
    handleAddExpense,
    handleStartEditExpense,
    handleCancelEditExpense,
    handleDeleteExpense,
  };
}
