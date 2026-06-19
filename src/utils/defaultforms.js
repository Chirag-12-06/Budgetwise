import { getTodayDate } from "../lib/api";

export function createDefaultExpenseForm() {
  return {
    title: "",
    amount: "",
    category: "",
    date: getTodayDate(),
    editScope: null,
  };
}

export function createDefaultRecurringForm() {
  return {
    enabled: false,
    frequency: "MONTHLY",
    intervalValue: "1",
    endType: "FOREVER",
    endCount: "",
    endDate: "",
  };
}