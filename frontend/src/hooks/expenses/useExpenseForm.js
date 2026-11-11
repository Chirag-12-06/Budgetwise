
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createDefaultExpenseForm } from "../../utils/defaultforms";
import { getTodayDate, formatDateKey } from "../../utils/date";
import { ROUTES } from "../../routes/routes";

export default function useExpenseForm() {
  const navigate = useNavigate();

  const [expenseForm, setExpenseForm] = useState(
    createDefaultExpenseForm(),
  );

  const [editingExpenseId, setEditingExpenseId] = useState(null);

  function handleStartEditExpense(expense) {
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
      currencyCode: expense.currencyCode || "INR",
      category: expense.category || "",
      date: expense.date || dateValue,
    });

    navigate(ROUTES.HOME);
  }

  function handleCancelEditExpense() {
    setEditingExpenseId(null);
    setExpenseForm(createDefaultExpenseForm());
  }

  return {
    expenseForm,
    setExpenseForm,
    editingExpenseId,
    setEditingExpenseId,
    handleStartEditExpense,
    handleCancelEditExpense,
  };
}
