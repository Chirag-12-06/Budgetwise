import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createDefaultExpenseForm } from "../../utils/defaultForms";
import { formatDateKey } from "../../utils/date";
import { ROUTES } from "../../routes/routes";
import useTodayDate from "../useTodayDate";

export default function useExpenseForm() {
  const navigate = useNavigate();
  const todayDate = useTodayDate();

  const [expenseForm, setExpenseForm] = useState(
    createDefaultExpenseForm(todayDate),
  );

  const [editingExpenseId, setEditingExpenseId] = useState(null);

  function handleStartEditExpense(expense) {
    const dateValue = expense?.createdAt
      ? formatDateKey(expense.createdAt)
      : todayDate;

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
    setExpenseForm(createDefaultExpenseForm(todayDate));
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
