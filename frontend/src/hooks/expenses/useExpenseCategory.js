import { useEffect, useRef, useState } from "react";
import { predictExpenseCategory } from "../../api/prediction.api";
import useExpenses from "./useExpenses";
import useCategories from "../useCategory";

export default function useExpenseCategory() {
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categoryManuallySelected, setCategoryManuallySelected] =
    useState(false);
  const { expenseForm, setExpenseForm, isEditingExpense } = useExpenses();
  const { categories } = useCategories();

  const categoryDropdownRef = useRef(null);

  const selectedCategory =
    categories.find((category) => category.id === expenseForm.category) || null;

  // Keep manual selection disabled for existing expenses.
  useEffect(() => {
    setCategoryManuallySelected(isEditingExpense);
  }, [isEditingExpense]);

  // Clear an automatically assigned category when the title is cleared.
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

  // Predict category from the expense title.
  useEffect(() => {
    if (isEditingExpense || categoryManuallySelected) {
      return;
    }

    const title = expenseForm.title.trim();

    if (title.length < 3) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const result = await predictExpenseCategory({
          title,
          amount: Number(expenseForm.amount || 0),
        });

        if (!result?.category || Number(result?.confidence || 0) < 0.6) {
          return;
        }

        setExpenseForm((current) => {
          if (current.title.trim() !== title) {
            return current;
          }

          return {
            ...current,
            category: result.category,
          };
        });
      } catch (error) {
        console.error("Prediction failed:", error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    expenseForm.title,
    expenseForm.amount,
    categoryManuallySelected,
    isEditingExpense,
    setExpenseForm,
  ]);

  function handleCategorySelection(categoryId) {
    setCategoryManuallySelected(true);

    setExpenseForm((current) => ({
      ...current,
      category: categoryId,
    }));

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
