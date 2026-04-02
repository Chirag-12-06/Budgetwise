import Button from "./button";
import Calendar from "./calendar";
import { formatCurrency } from "../lib/api";

const summaryCardClasses =
  "rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800";

const quickDateModes = [
  { value: "allTime", label: "All Time" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisYear", label: "This Year" },
];

export default function DateFilterPanel({
  expenses = [],
  dateFilterMode,
  onDateFilterModeChange,
  customDateFrom,
  onCustomDateFromChange,
  customDateTo,
  onCustomDateToChange,
  onApplyDateRange,
  dateRangeError,
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
        label: "Tracked Categories",
        value: summaryTrackedCategories ?? computedTrackedCategories,
      },
      {
        label: "Visible Entries",
        value: summaryVisibleEntries ?? computedVisibleEntries,
      },
    ]
    : [];

  const resolvedStats = stats.length ? stats : defaultStats;

  return (
    <div className={className}>
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

      {resolvedStats.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {resolvedStats.map((stat) => (
            <article className={summaryCardClasses} key={stat.label}>
              <span className="mb-2 block text-gray-500 dark:text-gray-300">{stat.label}</span>
              <strong className="text-[1.3rem]">{stat.value}</strong>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
