import {
  createExpense,
  createRecurringExpense,
  updateExpense,
  updateRecurringExpense,
  removeExpense,
  fetchExpenses,
  getTodayDate,
} from "../lib/api";

import { formatDateKey } from "../utils/date";


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

  handleApiError,
  showStatus,

  setView,
}) {

async function refreshExpenses(options = {}) {
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
    } catch (error) {
      const expensesData = await fetchExpenses(options);
      const expenses = Array.isArray(expensesData)
        ? expensesData.map((item) => ({
            ...item,
            isRecurring: Boolean(item.recurringId),
          }))
        : [];
      setExpenses(expenses);
      return expenses;
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
    setStatus(null);

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
        await updateRecurringExpense(editingRecurringExpenseId, recurringPayload);
        const syncedExpenses = await refreshExpenses();
        setExpenses(Array.isArray(syncedExpenses) ? syncedExpenses : []);
        showStatus("Recurring expense updated successfully", "success");
      } else if (editingExpenseId !== null) {
        const updatePayload = expenseForm.editScope === "future"
          ? { ...payload, scope: "future", recurring: recurringForm }
          : payload;
        await updateExpense(editingExpenseId, updatePayload);
        const syncedExpenses = await refreshExpenses();
        setExpenses(Array.isArray(syncedExpenses) ? syncedExpenses : []);
        showStatus("Expense updated successfully", "success");
      } else if (recurringForm.enabled) {
        await createRecurringExpense(recurringPayload);
        const syncedExpenses = await refreshExpenses();
        setExpenses(Array.isArray(syncedExpenses) ? syncedExpenses : []);
        showStatus("Recurring expense saved successfully", "success");
      } else {
        await createExpense(payload);
        const syncedExpenses = await refreshExpenses();
        setExpenses(Array.isArray(syncedExpenses) ? syncedExpenses : []);
        showStatus("Expense added successfully", "success");
      }

      setExpenseForm((current) => ({
        ...current,
        title: "",
        amount: "",
        category: "",
        date: getTodayDate(),
        editScope: null,
      }));
      setRecurringForm({
        enabled: false,
        frequency: "MONTHLY",
        intervalValue: "1",
        endType: "FOREVER",
        endCount: "",
        endDate: "",
      });
      setEditingExpenseId(null);
      setEditingRecurringExpenseId(null);
    } catch (error) {
      handleApiError(error, editingRecurringExpenseId !== null ? "Unable to update recurring expense" : editingExpenseId !== null ? "Unable to update expense" : "Unable to add expense");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartEditExpense(expense) {
    const dateValue = expense?.createdAt ? formatDateKey(expense.createdAt) : getTodayDate();
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
    setRecurringForm({
      enabled: false,
      frequency: "MONTHLY",
      intervalValue: "1",
      endType: "FOREVER",
      endCount: "",
      endDate: "",
    });
    setView(ADD_EXPENSE);
    setStatus(null);
  }

  function handleCancelEditExpense() {
      setEditingExpenseId(null);
      setEditingRecurringExpenseId(null);
      setExpenseForm({
        title: "",
        amount: "",
        category: "",
        date: getTodayDate(),
        editScope: null,
      });
      setRecurringForm({
        enabled: false,
        frequency: "MONTHLY",
        intervalValue: "1",
        endType: "FOREVER",
        endCount: "",
        endDate: "",
      });
    }

    async function handleDeleteExpense(id) {
    const confirmed = window.confirm("Are you sure you want to delete this expense?");
    if (!confirmed) return;
    try {
      await removeExpense(id);
      const syncedExpenses = await refreshExpenses();
      setExpenses(Array.isArray(syncedExpenses) ? syncedExpenses : []);
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
