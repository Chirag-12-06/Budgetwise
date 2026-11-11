
import { useState } from "react";

import {
  createExpense,
  fetchExpenses,
  removeExpense,
  updateExpense,
} from "../../api/expense.api";

export default function useExpenseCrud({
  user,
  editingExpenseId,
  handleApiError,
  showStatus,
  clearStatus,
  activeDateRange,
}) {
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

      const sortedExpenses = [...fetchedExpenses].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);

        return dateB - dateA;
      });

      setExpenses(sortedExpenses);
      return sortedExpenses;
    } finally {
      setLoadingExpenses(false);
    }
  }

  async function saveExpense(expenseForm) {
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
        showStatus("Expense updated successfully", "success");
      } else {
        await createExpense(payload);
        showStatus("Expense added successfully", "success");
      }

      await refreshExpenses(activeDateRange);
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
