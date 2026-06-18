import { useState } from "react";
import {
  fetchRecurringExpense,
  removeExpense,
  removeRecurringExpense,
  getTodayDate,
} from "../../lib/api.js";

import { formatDateKey } from "../../utils/date.js";
import {ROUTES} from "../../lib/routes.js";

export default function useRecurringExpenseActions({
  editingExpenseId,
  expenseForm,
  setExpenseForm,
  recurringForm,
  setRecurringForm,
  setExpenses,
  setSubmitting,
  showStatus,
  handleApiError,
  refreshExpenses,
  handleStartEditExpense,
  handleDeleteExpense,
  handleCancelEditExpense,
  navigate,
  editingRecurringExpenseId,
  setEditingRecurringExpenseId,
  setEditingExpenseId,
  clearStatus,
}) {

  const [recurringExpenseActionPrompt, setRecurringExpenseActionPrompt] = useState(null);


async function handleStartEditRecurringExpense(recurringExpenseId) {
    const numericId = Number(recurringExpenseId);
    if (Number.isNaN(numericId)) {
      return;
    }

    setSubmitting(true);
    clearStatus();
    try {
      const recurringExpense = await fetchRecurringExpense(numericId);
      const startDateValue = recurringExpense?.startDate ? formatDateKey(recurringExpense.startDate) : getTodayDate();
      setEditingExpenseId(null);
      setEditingRecurringExpenseId(recurringExpense.id);
      setExpenseForm({
        title: recurringExpense.title || "",
        amount:
          recurringExpense.amount !== undefined && recurringExpense.amount !== null
            ? String(recurringExpense.amount)
            : "",
        category: recurringExpense.category || "",
        date: startDateValue,
        editScope: null,
      });
      setRecurringForm({
        enabled: true,
        frequency: recurringExpense.frequency || "MONTHLY",
        intervalValue:
          recurringExpense.intervalValue !== undefined && recurringExpense.intervalValue !== null
            ? String(recurringExpense.intervalValue)
            : "1",
        endType: recurringExpense.endType || "FOREVER",
        endCount:
          recurringExpense.endCount !== undefined && recurringExpense.endCount !== null
            ? String(recurringExpense.endCount)
            : "",
        endDate: recurringExpense.endDate ? formatDateKey(recurringExpense.endDate) : "",
      });
      navigate(ROUTES.HOME);
    } catch (error) {
      handleApiError(error, "Unable to load recurring expense");
    } finally {
      setSubmitting(false);
    }
  }

   function handleRecurringExpenseActionRequest(expense, actionType) {
      if (!expense?.isRecurring) {
        return;
      }
  
      setRecurringExpenseActionPrompt({
        expense,
        actionType,
      });
    }
  
    function handleCloseRecurringExpenseActionPrompt() {
      setRecurringExpenseActionPrompt(null);
    }
  
    async function handleRecurringExpenseActionSelect(scope) {
      const prompt = recurringExpenseActionPrompt;
      if (!prompt) {
        return;
      }
  
      setRecurringExpenseActionPrompt(null);
  
      if (scope === "single") {
        if (prompt.actionType === "edit") {
          if (scope === "single") {
            handleStartEditExpense(prompt.expense);
          } else if (scope === "series") {
            void handleStartEditRecurringExpense(prompt.expense.recurringId || prompt.expense.id);
          }
        } else if (prompt.actionType === "delete") {
          void handleDeleteExpense(prompt.expense.id);
        }
        return;
      }
  
      if (scope === "future" && prompt.actionType === "delete") {
        setSubmitting(true);
        clearStatus();
  
        try {
          await removeExpense(prompt.expense.id);
  
          // Optimistically remove the selected and future-generated expenses
          // from local state so the UI updates immediately.
          setExpenses((current) =>
            Array.isArray(current)
              ? current.filter((e) => {
                  // If recurringId doesn't match, keep the expense.
                  if (!prompt.expense.recurringId) return true;
                  if (e.recurringId !== prompt.expense.recurringId) return true;
  
                  // Keep only expenses that occurred before the selected one.
                  return new Date(e.createdAt) < new Date(prompt.expense.createdAt);
                })
              : [],
          );
  
          if (prompt.expense.id === editingExpenseId) {
            handleCancelEditExpense();
          }
  
          showStatus("Selected and future expenses deleted", "success");
        } catch (error) {
          handleApiError(error, "Unable to delete selected and future expenses");
        } finally {
          setSubmitting(false);
        }
  
        return;
      }
  
      if (scope === "series" && prompt.actionType === "delete") {
        setSubmitting(true);
        clearStatus();
  
        void removeRecurringExpense(prompt.expense.recurringId || prompt.expense.id)
          .then(async () => {
            const syncedExpenses = await refreshExpenses();
            setExpenses(Array.isArray(syncedExpenses) ? syncedExpenses : []);
            showStatus("Recurring series deleted successfully", "success");
          })
          .catch((error) => {
            handleApiError(error, "Unable to delete recurring series");
          })
          .finally(() => {
            setSubmitting(false);
          });
        return;
      }
  
      if (scope === "series" && prompt.actionType === "edit") {
        void handleStartEditRecurringExpense(prompt.expense.recurringId || prompt.expense.id);
        return;
      }
  
      if (scope === "future" && prompt.actionType === "edit") {
        handleStartEditExpense({
          ...prompt.expense,
          id: prompt.expense.id,
        });
        setExpenseForm((current) => ({
          ...current,
          editScope: "future",
        }));
        return;
      }
  
      showStatus("This action is not implemented yet.", "error");
    }
    return {
  recurringExpenseActionPrompt,
  handleStartEditRecurringExpense,
  handleRecurringExpenseActionRequest,
  handleCloseRecurringExpenseActionPrompt,
  handleRecurringExpenseActionSelect,
};
}