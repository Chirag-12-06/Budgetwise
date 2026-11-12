export function getAvailableCategoryOptions(
  expenses,
  categories,
) {
  const categoryIds = new Set(
    expenses
      .map((expense) => expense.category)
      .filter(Boolean),
  );

  return Array.from(categoryIds)
    .map((value) => {
      const category = categories.find(
        (item) => item.id === value,
      );

      return {
        value,
        label: category?.name || "Uncategorized",
        icon: category?.icon || null,
        color: category?.color || "#808080",
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getExpenseFilterStats(expenses) {
  return {
    totalSpending: expenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0,
    ),
    trackedCategories: new Set(
      expenses.map((expense) => expense.category),
    ).size,
    visibleEntries: expenses.length,
  };
}

export function parseDateFilterMode(mode) {
  const [relative = "current", period = "day"] =
    String(mode || "").split(":");

  return { relative, period };
}