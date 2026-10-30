import { useEffect, useRef, useState } from "react";
import { getCategoryDisplay } from "../../lib/categoryConfig";

export default function useExpenseCategory({
  expenses,
  expenseForm,
  setExpenseForm,
  isEditingExpense,
}) {
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categoryManuallySelected, setCategoryManuallySelected] =
    useState(false);
  const categoryDropdownRef = useRef(null);
  const selectedCategory = expenseForm.category
  ? getCategoryDisplay(expenseForm.category)
  : null;

  useEffect(() => {
    if (isEditingExpense) {
      setCategoryManuallySelected(true);
      return;
    }

    if (!expenseForm.title && !expenseForm.amount && !expenseForm.category) {
      setCategoryManuallySelected(false);
    }
  }, [
    expenseForm.title,
    expenseForm.amount,
    expenseForm.category,
    isEditingExpense,
  ]);

  useEffect(() => {
    if (isEditingExpense || categoryManuallySelected) {
      return;
    }

    if (expenseForm.title.trim().length > 0 || !expenseForm.category) {
      return;
    }

    setExpenseForm((current) => {
      if (current.title.trim().length > 0 || !current.category) {
        return current;
      }

      return {
        ...current,
        category: "",
      };
    });
  }, [
    expenseForm.title,
    expenseForm.category,
    categoryManuallySelected,
    isEditingExpense,
    setExpenseForm,
  ]);

  function handleCategorySelection(categoryValue) {
    setCategoryManuallySelected(true);
    setExpenseForm((current) => ({ ...current, category: categoryValue }));
    setIsCategoryMenuOpen(false);
  }

  return {
    isCategoryMenuOpen,
    setIsCategoryMenuOpen,
    categoryManuallySelected,
    setCategoryManuallySelected,
    categoryDropdownRef,
    selectedCategory,
    handleCategorySelection,
  };
}
