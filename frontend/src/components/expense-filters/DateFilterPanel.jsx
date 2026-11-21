import { useEffect, useRef, useState } from "react";
import useFormattedCurrency from "../../hooks/useFormattedCurrency";
import useExpenses from "../../hooks/expenses/useExpenses";
import { Calendar, DateFilterSelector } from "../ui";

const periodModes = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const relativeModes = [
  { value: "previous", label: "Previous" },
  { value: "current", label: "Current" },
];

export default function DateFilterPanel() {
  const {
    expenses,
    filteredExpenses,
    dateFilterMode,
    handleDateFilterModeChange,
    customDateFrom,
    handleCustomDateFromChange,
    customDateTo,
    handleCustomDateToChange,
    dateRangeError,
  } = useExpenses();

  const formattedCurrency = useFormattedCurrency();

  // Calculate the selected period and relative mode.
  const normalizedMode = String(dateFilterMode || "");

  let currentPeriod = "day";
  let currentRelative = "current";

  if (normalizedMode.includes(":")) {
    const [relative, period] = normalizedMode.split(":");

    if (period) currentPeriod = period;
    if (relative) currentRelative = relative;
  }

  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (periodRef.current && !periodRef.current.contains(event.target)) {
        setPeriodOpen(false);
      }
    }

    window.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Summary uses filteredExpenses, so it respects both date and category filters.
  const computedTotalSpending = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense?.amount || 0),
    0,
  );

  const computedTrackedCategories = new Set(
    filteredExpenses.map((expense) => expense?.category),
  ).size;

  const computedVisibleEntries = filteredExpenses.length;

  const resolvedStats = [
    {
      label: "Total Spending",
      value: formattedCurrency(computedTotalSpending),
    },
    {
      label: "Categories",
      value: computedTrackedCategories,
    },
    {
      label: "Entries",
      value: computedVisibleEntries,
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="bw-quick-date-grid grid gap-2 sm:gap-3">
        {/* Relative period and period selectors */}
        <div className="flex w-full basis-full items-center gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[0.92rem] font-semibold">Period</span>
            <div className="inline-flex w-fit shrink-0 items-center rounded-xl border py-1.5 px-2 dark:border-gray-700 dark:bg-gray-900/40">
              {relativeModes.map((mode, index) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() =>
                    handleDateFilterModeChange(`${mode.value}:${currentPeriod}`)
                  }
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    currentRelative === mode.value
                      ? "rounded-lg bg-indigo-600 text-white shadow-sm"
                      : "dark:text-gray-300 dark:hover:text-white"
                  }`}
                >
                  {mode.label}

                  {index !== relativeModes.length - 1 &&
                    currentRelative !== mode.value &&
                    currentRelative !== relativeModes[index + 1].value && (
                      <span className="absolute right-0 top-1/2 h-4 -translate-y-1/2 border-r border-gray-600" />
                    )}
                </button>
              ))}
            </div>

            <DateFilterSelector
              options={periodModes}
              value={currentPeriod}
              onChange={(value) =>
                handleDateFilterModeChange(`${currentRelative}:${value}`)
              }
            />
          </div>
        </div>

        {/* Custom date range */}
        <div className="grid w-full basis-full gap-3">
          <div className="bw-date-range-grid grid grid-cols-2 gap-3">
            <label className="grid min-w-0 gap-2">
              <span className="text-[0.92rem] font-semibold">From</span>

              <Calendar
                expenses={expenses}
                value={customDateFrom}
                onChange={(event) =>
                  handleCustomDateFromChange(event.target.value)
                }
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-[0.92rem] font-semibold">To</span>

              <Calendar
                expenses={expenses}
                value={customDateTo}
                onChange={(event) =>
                  handleCustomDateToChange(event.target.value)
                }
              />
            </label>
          </div>
        </div>

        {dateRangeError ? (
          <p className="text-sm font-semibold text-red-600 dark:text-red-300">
            {dateRangeError}
          </p>
        ) : null}
      </div>

      {/* Spending summary */}
      {resolvedStats.length > 0 ? (
        <div
          className="grid gap-2 sm:gap-3"
          style={{
            gridTemplateColumns:
              "minmax(8.5rem, 1.55fr) minmax(5.25rem, 1fr) minmax(5.25rem, 1fr)",
          }}
        >
          {resolvedStats.map((stat) => (
            <article
              className="min-w-0 rounded-lg border bg-white p-3 shadow-lg dark:border-gray-600 dark:bg-gray-800 sm:p-4"
              key={stat.label}
            >
              <span className="mb-1 block truncate text-[0.72rem] text-gray-500 dark:text-gray-300 sm:text-xs">
                {stat.label}
              </span>

              <strong className="block truncate text-base sm:text-lg">
                {stat.value}
              </strong>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
