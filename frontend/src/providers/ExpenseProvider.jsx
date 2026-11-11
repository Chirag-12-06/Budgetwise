import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ExpenseContext from "./ExpenseContext";

import {
  createDefaultExpenseForm,
  createDefaultRecurringForm,
} from "../../../utils/defaultforms";

import useCategoryFilters from "../hooks/filters/useCategoryFilters";

export default function ExpenseProvider({
  children,
  user,
  handleApiError,
  showStatus,
  clearStatus,
}) {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingRecurringExpenseId, setEditingRecurringExpenseId] =
    useState(null);

  const [expenseForm, setExpenseForm] = useState(createDefaultExpenseForm());
  const [recurringForm, setRecurringForm] = useState(
    createDefaultRecurringForm(),
  );
  const [activeDateRange, setActiveDateRange] = useState({});

  const {
    selectedCategoryFilters,
    setSelectedCategoryFilters,
    handleCategoryFilterToggle,
    clearCategoryFilters,
  } = useCategoryFilters();

  return (
    <ExpenseContext.Provider value={{}}>{children}</ExpenseContext.Provider>
  );
}
