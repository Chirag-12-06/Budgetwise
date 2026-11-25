export function createDefaultExpenseForm(todayDate) {
  return {
    title: "",
    amount: "",
    currencyCode: "INR",
    category: "",
    date: todayDate,
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
