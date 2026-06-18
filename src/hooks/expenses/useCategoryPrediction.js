import { useEffect, useRef } from "react";
import { predictExpenseCategory, trainExpenseModel } from "../../lib/api";

export default function useCategoryPrediction({
  expenses,
  expenseForm,
  setExpenseForm,
  isEditingExpense,
  categoryManuallySelected,
}) {

  const predictionDebounceRef = useRef(null);

  useEffect(() => {
    async function initializeModel() {
      if (isEditingExpense || expenses.length < 10) {
        return;
      }

      try {
        await trainExpenseModel();
      } catch (_error) {}
    }

    initializeModel();
  }, [expenses.length, isEditingExpense]);

  useEffect(() => {
    if (isEditingExpense || categoryManuallySelected) {
      return;
    }

    const title = expenseForm.title.trim();

    if (title.length < 3) {
      return;
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
          if (
            current.title.trim() !== title ||
            categoryManuallySelected
          ) {
            return current;
          }

          return {
            ...current,
            category: result.category,
          };
        });
      } catch (_error) {}
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
}