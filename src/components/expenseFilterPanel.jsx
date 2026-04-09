import Button from "./button";
import Calendar from "./calendar";
import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, CATEGORY_GROUPS, getCategoryDisplay } from "../lib/categoryConfig";

const summaryCardClasses =
  "rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:p-4";

const quickDateModes = [
  { value: "allTime", label: "All Time" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisYear", label: "This Year" },
];

const summaryGridTemplateColumns = "minmax(8.5rem, 1.55fr) minmax(5.25rem, 1fr) minmax(5.25rem, 1fr)";
const categoryGroupIcons = {
  Food: "fas fa-bowl-food",
  Drinks: "fas fa-glass-cheers",
  Entertainment: "fas fa-film",
  Home: "fas fa-home",
  Life: "fas fa-heart",
  Transportation: "fas fa-route",
  Utilities: "fas fa-bolt",
  Other: "fas fa-layer-group",
};

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
  const availableCategorySet = new Set(availableCategoryOptions.map((option) => option.value));
  const availableCategoryGroups = CATEGORY_GROUPS.map((group) => {
    const values = group.options
      .map((option) => option.value)
      .filter((value) => availableCategorySet.has(value));

    if (!values.length) {
      return null;
    }

    const selectedCount = values.filter((value) => selectedCategoryFilters.includes(value)).length;
    const accentColor = CATEGORY_COLORS[values[0]] || CATEGORY_COLORS.uncategorized;

    return {
      label: group.label,
      values,
      selectedCount,
      isAllSelected: selectedCount === values.length,
      icon: categoryGroupIcons[group.label] || "fas fa-layer-group",
      accentColor,
    };
  }).filter(Boolean);
  const shouldConstrainGroupHeight = availableCategoryGroups.length > 3;
  const shouldConstrainCategoryHeight = availableCategoryOptions.length > 4;
  const categoryGridColumnsClass = availableCategoryOptions.length <= 3 ? "grid-cols-1" : "sm:grid-cols-2";

  function handleCategoryGroupClick(groupValues) {
    if (!onCategoryFilterToggle) {
      return;
    }

    const normalizedValues = Array.from(new Set(groupValues.map((value) => value || "uncategorized")));
    const allSelected = normalizedValues.every((value) => selectedCategoryFilters.includes(value));

    normalizedValues.forEach((value) => {
      const currentlySelected = selectedCategoryFilters.includes(value);
      const shouldToggle = allSelected ? currentlySelected : !currentlySelected;

      if (shouldToggle) {
        onCategoryFilterToggle(value);
      }
    });
  }

  return (
    <div className={className}>
      <div className="grid gap-4 xl:grid-cols-2 xl:items-stretch">
        <div className="grid gap-4">
          <div className="bw-quick-date-grid flex flex-wrap gap-2 sm:gap-3">
            {quickDateModes.map((mode) => (
              <Button
                key={mode.value}
                active={dateFilterMode === mode.value}
                className="bw-quick-date-button max-w-32 shrink-0 px-3 py-2 text-xs sm:max-w-36 sm:px-4 sm:text-sm"
                onClick={() => onDateFilterModeChange(mode.value)}
              >
                <span className="truncate">{mode.label}</span>
              </Button>
            ))}
          </div>

          <div className="grid gap-3">
            <div className="bw-date-range-grid grid grid-cols-2 gap-3">
              <label className="grid min-w-0 gap-2">
                <span className="text-[0.92rem] font-semibold">From</span>
                <Calendar
                  expenses={expenses}
                  value={customDateFrom}
                  onChange={(event) => onCustomDateFromChange(event.target.value)}
                />
              </label>
              <label className="grid min-w-0 gap-2">
                <span className="text-[0.92rem] font-semibold">To</span>
                <Calendar
                  expenses={expenses}
                  value={customDateTo}
                  onChange={(event) => onCustomDateToChange(event.target.value)}
                />
              </label>
            </div>

            <div className="bw-date-apply-row flex justify-end">
              <Button className="min-w-20" variant="outline" onClick={onApplyDateRange}>
                Apply
              </Button>
            </div>
          </div>

          {dateRangeError ? (
            <p className="text-sm font-semibold text-red-600 dark:text-red-300">{dateRangeError}</p>
          ) : null}
        </div>

        <section className="grid gap-2">

          {availableCategoryOptions.length ? (
            <div
              className={`grid gap-2 ${
                availableCategoryGroups.length
                  ? "md:grid-cols-[minmax(11rem,0.95fr)_minmax(0,1.25fr)]"
                  : "grid-cols-1"
              } items-start`}
            >
              {availableCategoryGroups.length ? (
                <div className="grid gap-1 self-start">
                  <div className="flex h-5 items-center px-1">
                    <p className="text-[0.7rem] font-semibold leading-none uppercase tracking-[0.08em] text-gray-500 dark:text-gray-300">
                      Quick Groups
                    </p>
                  </div>
                  <div
                    className={`rounded-lg border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800 ${
                      shouldConstrainGroupHeight ? "max-h-40 overflow-y-auto overscroll-y-contain" : ""
                    }`}
                  >
                    <div className="grid gap-2">
                      {availableCategoryGroups.map((group) => {
                        const progressPercent = (group.selectedCount / group.values.length) * 100;

                        return (
                          <Button
                            variant="plain"
                            aria-pressed={group.isAllSelected}
                            className={`relative grid h-10 grid-cols-[auto_1fr_auto] items-center gap-2 overflow-hidden rounded-xl border px-2 py-1 text-left transition-colors ${
                              group.isAllSelected
                                ? "border-indigo-500 bg-indigo-50/90 dark:border-indigo-300 dark:bg-indigo-500/15"
                                : "border-gray-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-indigo-400/70 dark:hover:bg-gray-700/70"
                            }`}
                            key={group.label}
                            type="button"
                            onClick={() => handleCategoryGroupClick(group.values)}
                          >
                            <span
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[0.68rem] text-white"
                              style={{ backgroundColor: group.accentColor }}
                            >
                              <i className={group.icon} aria-hidden="true" />
                            </span>

                            <span className="min-w-0 flex items-center gap-1.5">
                              <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                                {group.label}
                              </span>
                              <span className="shrink-0 text-[0.62rem] text-gray-500 dark:text-gray-300">
                                {group.selectedCount}/{group.values.length}
                              </span>
                            </span>

                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide ${
                                group.isAllSelected
                                  ? "bg-indigo-600 text-white dark:bg-indigo-400 dark:text-slate-900"
                                  : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                              }`}
                            >
                              {group.isAllSelected ? "All" : "Pick"}
                            </span>

                            <span
                              aria-hidden="true"
                              className="absolute bottom-0 left-0 h-1 transition-all duration-200"
                              style={{ width: `${progressPercent}%`, backgroundColor: group.accentColor }}
                            />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-1 self-start">
                <div className="flex h-5 items-center justify-between gap-2 px-1">
                  <p className="text-[0.7rem] font-semibold leading-none uppercase tracking-[0.08em] text-gray-500 dark:text-gray-300">
                    Categories
                  </p>
                  {selectedCategoryFilters.length ? (
                    <Button
                      variant="plain"
                      className="text-[0.7rem] font-semibold leading-none uppercase tracking-[0.08em] text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                      type="button"
                      onClick={onClearCategoryFilters}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
                <div
                  className={`rounded-lg border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800 ${
                    shouldConstrainCategoryHeight ? "max-h-40 overflow-y-auto overscroll-y-contain" : ""
                  }`}
                >
                  <div className={`grid gap-2 ${categoryGridColumnsClass}`}>
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
