import { useEffect, useRef, useState } from "react";
import { getCategoryDisplay } from "../lib/categoryConfig";
import { predictExpenseCategory, trainExpenseModel } from "../lib/api";

export default function useAddExpensePage({
  expenses,
  expenseForm,
  setExpenseForm,
  isEditingExpense,
}) {
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categoryManuallySelected, setCategoryManuallySelected] = useState(false);
  const categoryDropdownRef = useRef(null);
  const predictionDebounceRef = useRef(null);

  const selectedCategory = expenseForm.category
    ? getCategoryDisplay(expenseForm.category)
    : null;

  useEffect(() => {
    async function initializeModel() {
      if (isEditingExpense || expenses.length < 10) {
        return;
      }

      try {
        await trainExpenseModel();
      } catch (_error) {
        // Prediction can still use keyword rules even if training fails.
      }
    }

    initializeModel();
  }, [expenses.length, isEditingExpense]);

  useEffect(() => {
    if (isEditingExpense) {
      return undefined;
    }

    if (categoryManuallySelected) {
      return undefined;
    }

    const title = expenseForm.title.trim();
    if (title.length < 3) {
      return undefined;
    }

    if (predictionDebounceRef.current) {
      clearTimeout(predictionDebounceRef.current);
    }

    predictionDebounceRef.current = setTimeout(async () => {
      try {
        const result = await predictExpenseCategory({
          title,
          amount: Number(expenseForm.amount || 0),
        });

        if (!result?.category || Number(result?.confidence || 0) < 0.6) {
          return;
        }

        setExpenseForm((current) => {
          if (current.title.trim() !== title || categoryManuallySelected) {
            return current;
          }

          return {
            ...current,
            category: result.category,
          };
        });
      } catch (_error) {
        // Keep form usable if prediction service is unavailable.
      }
    }, 500);

    return () => {
      if (predictionDebounceRef.current) {
        clearTimeout(predictionDebounceRef.current);
        predictionDebounceRef.current = null;
      }
    };
  }, [
    expenseForm.title,
    expenseForm.amount,
    categoryManuallySelected,
    isEditingExpense,
    setExpenseForm,
  ]);

  useEffect(() => {
    if (isEditingExpense) {
      setCategoryManuallySelected(true);
      return;
    }

    if (!expenseForm.title && !expenseForm.amount && !expenseForm.category) {
      setCategoryManuallySelected(false);
    }
  }, [expenseForm.title, expenseForm.amount, expenseForm.category, isEditingExpense]);

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
  }, [expenseForm.title, expenseForm.category, categoryManuallySelected, isEditingExpense, setExpenseForm]);

  useEffect(() => {
    if (!isCategoryMenuOpen) {
      return undefined;
    }

    function closeOnOutsideClick(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryMenuOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setIsCategoryMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isCategoryMenuOpen]);

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
