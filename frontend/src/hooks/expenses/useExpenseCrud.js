import { useState } from "react";

import {
  createExpense,
  fetchExpenses,
  removeExpense,
  updateExpense,
} from "../../api/expense.api";

import useStatus from "../auth/useStatus";

export default function useExpenseCrud({
  user,
  handleApiError,
  activeDateRange,
}) {
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showStatus, clearStatus } = useStatus();

  async function refreshExpenses(options = activeDateRange) {
    if (!user) return [];

    setLoadingExpenses(true);

    try {
      const response = await fetchExpenses(options);

      const fetchedExpenses = Array.isArray(response?.data)
        ? response.data.map((item) => ({
            ...item,
            category: item.categoryId,
            date: item.transactionDate,
          }))
        : [];

      setExpenses(fetchedExpenses);
      return fetchedExpenses;
    } finally {
      setLoadingExpenses(false);
    }
  }

  async function saveExpense(expenseForm, editingExpenseId) {
    setSubmitting(true);
    clearStatus();

    const payload = {
      title: expenseForm.title.trim(),
      amount: expenseForm.amount,
      currencyCode: expenseForm.currencyCode,
      category: expenseForm.category,
      date: expenseForm.date,
    };

    try {
      if (editingExpenseId !== null) {
        await updateExpense(editingExpenseId, payload);
      } else {
        await createExpense(payload);
      }

      await refreshExpenses(activeDateRange);

      showStatus(
        editingExpenseId !== null
          ? "Expense updated successfully"
          : "Expense added successfully",
        "success",
      );
    } catch (error) {
      handleApiError(
        error,
        editingExpenseId !== null
          ? "Unable to update expense"
          : "Unable to add expense",
      );

      throw error;
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteExpense(id) {
    try {
      await removeExpense(id);
      await refreshExpenses(activeDateRange);
      showStatus("Expense deleted successfully", "success");
    } catch (error) {
      handleApiError(error, "Failed to delete expense");
    }
  }

  return {
    expenses,
    setExpenses,
    loadingExpenses,
    submitting,
    refreshExpenses,
    saveExpense,
    deleteExpense,
  };
}
