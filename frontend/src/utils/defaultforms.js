import { getTodayDate } from "./date";

export function createDefaultExpenseForm() {
  return {
    title: "",
    amount: "",
    currencyCode: "INR",
    category: "",
    date: getTodayDate(),
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