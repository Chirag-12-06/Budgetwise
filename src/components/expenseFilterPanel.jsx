import Button from "./button";
import Calendar from "./calendar";
import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, getCategoryDisplay } from "../lib/categoryConfig";

const summaryCardClasses =
  "rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:p-4";

const quickDateModes = [
  { value: "allTime", label: "All Time" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisYear", label: "This Year" },
];

const summaryGridTemplateColumns = "minmax(8.5rem, 1.55fr) minmax(5.25rem, 1fr) minmax(5.25rem, 1fr)";

export default function ExpenseFilterPanel({
  expenses = [],
  categoryFilterExpenses = null,
  dateFilterMode,
  onDateFilterModeChange,
  customDateFrom,
  onCustomDateFromChange,
  customDateTo,
  onCustomDateToChange,
  onApplyDateRange,
  dateRangeError,
  selectedCategoryFilters = [],
  onCategoryFilterToggle,
  onClearCategoryFilters,
  summaryExpenses = null,
  summaryTotalSpending = null,
  summaryTrackedCategories = null,
  summaryVisibleEntries = null,
  stats = [],
  className = "mb-5 grid gap-4",
}) {
  const hasSummaryExpenses = Array.isArray(summaryExpenses);
  const computedTotalSpending = hasSummaryExpenses
    ? summaryExpenses.reduce((sum, expense) => sum + Number(expense?.amount || 0), 0)
    : 0;
  const computedTrackedCategories = hasSummaryExpenses
    ? new Set(summaryExpenses.map((expense) => expense?.category || "uncategorized")).size
    : 0;
  const computedVisibleEntries = hasSummaryExpenses ? summaryExpenses.length : 0;

  const defaultStats = hasSummaryExpenses
    ? [
      {
        label: "Total Spending",
        value: summaryTotalSpending ?? formatCurrency(computedTotalSpending),
      },
      {
        label: "Categories",
        value: summaryTrackedCategories ?? computedTrackedCategories,
      },
      {
        label: "Entries",
        value: summaryVisibleEntries ?? computedVisibleEntries,
      },
    ]
    : [];

  const resolvedStats = stats.length ? stats : defaultStats;
  const categorySourceExpenses = Array.isArray(categoryFilterExpenses)
    ? categoryFilterExpenses
    : Array.isArray(expenses)
      ? expenses
      : [];
  const availableCategoryOptions = Array.from(
    new Set(categorySourceExpenses.map((expense) => expense?.category || "uncategorized")),
  )
    .map((value) => ({ value, ...getCategoryDisplay(value) }))
    .sort((left, right) => left.label.localeCompare(right.label));

  return (
    <div className={className}>
      <div className="grid gap-4 xl:grid-cols-2 xl:items-stretch">
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-3">
            {quickDateModes.map((mode) => (
              <Button
                key={mode.value}
                active={dateFilterMode === mode.value}
                onClick={() => onDateFilterModeChange(mode.value)}
              >
                {mode.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold">From</span>
              <Calendar
                expenses={expenses}
                value={customDateFrom}
                onChange={(event) => onCustomDateFromChange(event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold">To</span>
              <Calendar
                expenses={expenses}
                value={customDateTo}
                onChange={(event) => onCustomDateToChange(event.target.value)}
              />
            </label>
            <Button className="self-end" variant="outline" onClick={onApplyDateRange}>
              Apply
            </Button>
          </div>

          {dateRangeError ? (
            <p className="text-sm font-semibold text-red-600 dark:text-red-300">{dateRangeError}</p>
          ) : null}
        </div>

        <section className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.92rem] font-semibold">Categories</span>
            {selectedCategoryFilters.length ? (
              <button
                className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                type="button"
                onClick={onClearCategoryFilters}
              >
                Clear
              </button>
            ) : null}
          </div>

          {availableCategoryOptions.length ? (
            <div className="max-h-26 overflow-y-auto overscroll-y-contain rounded-lg border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800">
              <div className="grid gap-2 sm:grid-cols-2">
                {availableCategoryOptions.map((option) => (
                  <label
                    className="flex h-10 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/70"
                    key={option.value}
                  >
                    <input
                      checked={selectedCategoryFilters.includes(option.value)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      type="checkbox"
                      onChange={() => onCategoryFilterToggle?.(option.value)}
                    />
                    <span
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white"
                      style={{
                        backgroundColor: CATEGORY_COLORS[option.value] || CATEGORY_COLORS.uncategorized,
                      }}
                    >
                      <i className={option.icon} aria-hidden="true" />
                    </span>
                    <span className="truncate">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-300">No categories available yet.</p>
          )}
        </section>
      </div>

      {resolvedStats.length ? (
        <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: summaryGridTemplateColumns }}>
          {resolvedStats.map((stat) => (
            <article className={`${summaryCardClasses} min-w-0`} key={stat.label}>
              <span className="mb-1 block truncate text-[0.72rem] text-gray-500 dark:text-gray-300 sm:text-xs">
                {stat.label}
              </span>
              <strong className="block truncate text-base sm:text-lg">{stat.value}</strong>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
