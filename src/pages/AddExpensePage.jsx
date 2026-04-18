import { useEffect, useRef, useState } from "react";
import {
  CATEGORY_COLORS,
  CATEGORY_GROUPS,
  CATEGORY_OPTIONS,
} from "../lib/categoryConfig";
import Button from "../components/button";
import Calendar from "../components/calendar";
import PanelCard from "../components/panelCard";
import useAddExpensePage from "../hooks/useAddExpensePage";

const fieldClasses =
  "h-13 w-full rounded-xl border border-gray-300 bg-white px-4 text-lg text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700/80 dark:text-white dark:placeholder:text-slate-300";
const submitButtonClasses =
  "w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-center text-xl font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-70";
const updateButtonClasses =
  "w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-center text-xl font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-70";
const cancelButtonClasses =
  "w-full rounded-xl bg-red-600 px-4 py-3.5 text-center text-xl font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70";
const scanButtonClasses =
  "inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-lg font-medium text-white transition-colors hover:bg-indigo-500";
const recurrenceOptions = [
  { value: "", label: "Don't Repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];
const recurrenceDurationOptions = [
  { value: "until", label: "Until" },
  { value: "forever", label: "Forever" },
  { value: "count", label: "Specific number of times" },
];
const weekdayOptions = [
  { label: "M", value: 1 },
  { label: "T", value: 2 },
  { label: "W", value: 3 },
  { label: "T", value: 4 },
  { label: "F", value: 5 },
  { label: "S", value: 6 },
  { label: "S", value: 0 },
];
const weekdayLongLabels = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

export default function AddExpensePage({
  expenses,
  expenseForm,
  setExpenseForm,
  handleAddExpense,
  submitting,
  isEditingExpense,
  handleCancelEditExpense,
}) {
  const {
    isCategoryMenuOpen,
    setIsCategoryMenuOpen,
    categoryManuallySelected,
    setCategoryManuallySelected,
    categoryDropdownRef,
    selectedCategory,
    handleCategorySelection,
  } = useAddExpensePage({
    expenses,
    expenseForm,
    setExpenseForm,
    isEditingExpense,
  });
  const [showScanUnderDevelopmentPopup, setShowScanUnderDevelopmentPopup] =
    useState(false);
  const [
    showRecurrenceUnderDevelopmentPopup,
    setShowRecurrenceUnderDevelopmentPopup,
  ] = useState(false);
  const [isRecurrenceMenuOpen, setIsRecurrenceMenuOpen] = useState(false);
  const recurrenceDropdownRef = useRef(null);
  const isDeployedBuild = !import.meta.env.DEV;

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        recurrenceDropdownRef.current &&
        !recurrenceDropdownRef.current.contains(event.target)
      ) {
        setIsRecurrenceMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("touchstart", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  const selectedRecurrenceOption = recurrenceOptions.find(
    (option) => option.value === (expenseForm.recurrenceFrequency || ""),
  );
  const selectedWeeklyDays = Array.isArray(expenseForm.recurrenceWeeklyDays)
    ? [...expenseForm.recurrenceWeeklyDays].sort((left, right) => left - right)
    : [];
  const selectedWeeklyDaysLabel = selectedWeeklyDays.length
    ? selectedWeeklyDays
        .map((day) => weekdayLongLabels[day] || String(day))
        .join(", ")
    : "None selected";
  const recurrenceTriggerLabel =
    expenseForm.recurrenceFrequency === "weekly" && selectedWeeklyDays.length
      ? `Weekly · ${selectedWeeklyDays.map((day) => weekdayOptions.find((option) => option.value === day)?.label || String(day)).join(" / ")}`
      : selectedRecurrenceOption?.label || "Don't Repeat";

  return (
    <PanelCard variant="addExpense" className="mx-auto w-full max-w-190">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
          {isEditingExpense ? "Edit Expense" : "Add New Expense"}
        </h2>
        <Button
          variant="plain"
          className={scanButtonClasses}
          type="button"
          onClick={() => setShowScanUnderDevelopmentPopup(true)}
        >
          <i className="fas fa-camera" aria-hidden="true" />
          <span>Scan Receipt</span>
        </Button>
      </div>

      <form className="grid gap-7" onSubmit={handleAddExpense}>
        <div className="grid gap-4 md:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="relative" ref={categoryDropdownRef}>
            <Button
              variant="plain"
              className={`${fieldClasses} flex items-center justify-between gap-2 px-3 text-left`}
              type="button"
              aria-expanded={isCategoryMenuOpen}
              aria-haspopup="listbox"
              onClick={() => setIsCategoryMenuOpen((current) => !current)}
            >
              {selectedCategory ? (
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm text-white"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[selectedCategory.value] ||
                        CATEGORY_COLORS.uncategorized,
                    }}
                  >
                    <i className={selectedCategory.icon} aria-hidden="true" />
                  </span>
                  <span className="text-base">{selectedCategory.label}</span>
                </span>
              ) : (
                <span className="flex min-w-0 items-center gap-3 text-gray-500 dark:text-slate-300">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-200 text-sm text-gray-600 dark:bg-slate-600/90 dark:text-slate-200">
                    <i className="fas fa-tags" aria-hidden="true" />
                  </span>
                  <span className="text-base">Category</span>
                </span>
              )}
              <i
                className={`fas ${isCategoryMenuOpen ? "fa-chevron-up" : "fa-chevron-down"} shrink-0 text-sm text-gray-500 dark:text-slate-300`}
                aria-hidden="true"
              />
            </Button>

            <select
              className="sr-only"
              value={expenseForm.category}
              onChange={(event) => {
                setCategoryManuallySelected(true);
                setExpenseForm((current) => ({
                  ...current,
                  category: event.target.value,
                }));
              }}
              required
              tabIndex={-1}
              aria-hidden="true"
            >
              <option value="" disabled>
                Category
              </option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {isCategoryMenuOpen ? (
              <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-2xl backdrop-blur dark:border-slate-600 dark:bg-slate-800/95">
                {CATEGORY_GROUPS.map((group) => (
                  <section
                    className="border-b border-gray-200 py-1.5 last:border-b-0 dark:border-slate-600/70"
                    key={group.label}
                  >
                    <p className="px-2 pb-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-slate-300">
                      {group.label}
                    </p>
                    <div className="grid gap-1">
                      {group.options.map((option) => {
                        const optionColor =
                          CATEGORY_COLORS[option.value] ||
                          CATEGORY_COLORS.uncategorized;
                        const isSelected =
                          expenseForm.category === option.value;

                        return (
                          <Button
                            variant="plain"
                            className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                              isSelected
                                ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-500/25 dark:text-white"
                                : "text-gray-700 hover:bg-gray-100 dark:text-slate-100 dark:hover:bg-slate-700/80"
                            }`}
                            key={option.value}
                            type="button"
                            onClick={() =>
                              handleCategorySelection(option.value)
                            }
                          >
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm text-white"
                              style={{ backgroundColor: optionColor }}
                            >
                              <i className={option.icon} aria-hidden="true" />
                            </span>
                            <span className="truncate">{option.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : null}
          </div>

          <input
            className={fieldClasses}
            type="text"
            value={expenseForm.title}
            onChange={(event) =>
              setExpenseForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            required
            placeholder="Title"
          />
        </div>

        <input
          className={fieldClasses}
          type="number"
          min="0"
          step="0.01"
          value={expenseForm.amount}
          onChange={(event) =>
            setExpenseForm((current) => ({
              ...current,
              amount: event.target.value,
            }))
          }
          required
          placeholder="Amount"
        />

        <Calendar
          className="min-h-13 rounded-xl border border-gray-300 bg-white px-4 text-lg text-gray-900 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-700/80 dark:text-white"
          expenses={expenses}
          value={expenseForm.date}
          onChange={(event) =>
            setExpenseForm((current) => ({
              ...current,
              date: event.target.value,
            }))
          }
        />

        <div className="grid gap-4">
          <label>
            <div className="relative" ref={recurrenceDropdownRef}>
              <Button
                variant="plain"
                className={`${fieldClasses} flex items-center justify-between gap-2 px-3 text-left`}
                type="button"
                aria-expanded={isRecurrenceMenuOpen}
                aria-haspopup="listbox"
                onClick={() => {
                  if (isDeployedBuild) {
                    setShowRecurrenceUnderDevelopmentPopup(true);
                    return;
                  }

                  setIsRecurrenceMenuOpen((current) => !current);
                }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-200 text-sm text-gray-600 dark:bg-slate-600/90 dark:text-slate-200">
                    <i className="fas fa-repeat" aria-hidden="true" />
                  </span>
                  <span className="text-base text-gray-900 dark:text-white">
                    {recurrenceTriggerLabel}
                  </span>
                </span>
                <i
                  className={`fas ${isRecurrenceMenuOpen ? "fa-chevron-up" : "fa-chevron-down"} shrink-0 text-sm text-gray-500 dark:text-slate-300`}
                  aria-hidden="true"
                />
              </Button>

              <select
                className="sr-only"
                value={expenseForm.recurrenceFrequency || ""}
                onChange={(event) => {
                  const frequency = event.target.value;
                  const pickedDate = new Date(expenseForm.date || new Date());
                  const defaultWeekday = Number.isNaN(pickedDate.getTime())
                    ? 1
                    : pickedDate.getDay();
                  setExpenseForm((current) => ({
                    ...current,
                    recurrenceFrequency: frequency,
                    recurrenceEndDate: frequency
                      ? current.recurrenceEndDate
                      : "",
                    recurrenceDuration: frequency
                      ? current.recurrenceDuration || "until"
                      : "until",
                    recurrenceCount: frequency ? current.recurrenceCount : "",
                    recurrenceWeeklyDays:
                      frequency === "weekly"
                        ? current.recurrenceWeeklyDays?.length
                          ? current.recurrenceWeeklyDays
                          : [defaultWeekday]
                        : [],
                    recurrenceMonthlyPattern:
                      frequency === "monthly"
                        ? current.recurrenceMonthlyPattern || "date"
                        : "date",
                    recurrenceYearlyPattern:
                      frequency === "yearly"
                        ? current.recurrenceYearlyPattern || "date"
                        : "date",
                  }));
                }}
                tabIndex={-1}
                aria-hidden="true"
              >
                {recurrenceOptions.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {isRecurrenceMenuOpen ? (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-2xl backdrop-blur dark:border-slate-600 dark:bg-slate-800/95">
                  <div className="grid gap-1">
                    {recurrenceOptions.map((option) => {
                      const isSelected =
                        (expenseForm.recurrenceFrequency || "") ===
                        option.value;

                      return (
                        <Button
                          variant="plain"
                          className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                            isSelected
                              ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-500/25 dark:text-white"
                              : "text-gray-700 hover:bg-gray-100 dark:text-slate-100 dark:hover:bg-slate-700/80"
                          }`}
                          key={option.value || "none"}
                          type="button"
                          onClick={() => {
                            const frequency = option.value;
                            const pickedDate = new Date(
                              expenseForm.date || new Date(),
                            );
                            const defaultWeekday = Number.isNaN(
                              pickedDate.getTime(),
                            )
                              ? 1
                              : pickedDate.getDay();

                            setExpenseForm((current) => ({
                              ...current,
                              recurrenceFrequency: frequency,
                              recurrenceEndDate: frequency
                                ? current.recurrenceEndDate
                                : "",
                              recurrenceDuration: frequency
                                ? current.recurrenceDuration || "until"
                                : "until",
                              recurrenceCount: frequency
                                ? current.recurrenceCount
                                : "",
                              recurrenceWeeklyDays:
                                frequency === "weekly"
                                  ? current.recurrenceWeeklyDays?.length
                                    ? current.recurrenceWeeklyDays
                                    : [defaultWeekday]
                                  : [],
                              recurrenceMonthlyPattern:
                                frequency === "monthly"
                                  ? current.recurrenceMonthlyPattern || "date"
                                  : "date",
                              recurrenceYearlyPattern:
                                frequency === "yearly"
                                  ? current.recurrenceYearlyPattern || "date"
                                  : "date",
                            }));
                            setIsRecurrenceMenuOpen(false);
                          }}
                        >
                          <span>{option.label}</span>
                          {isSelected ? (
                            <i
                              className="fas fa-check text-xs"
                              aria-hidden="true"
                            />
                          ) : null}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </label>

          {expenseForm.recurrenceFrequency === "weekly" ? (
            <div className="rounded-xl border border-gray-300 bg-white p-4 dark:border-slate-600 dark:bg-slate-700/50">
              <div className="grid grid-cols-7 justify-items-center gap-2">
                {weekdayOptions.map((day) => (
                  <button
                    key={`${day.label}-${day.value}`}
                    type="button"
                    className={`inline-flex h-11 w-full max-w-11 items-center justify-center rounded-full border text-sm font-bold shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/60 ${
                      (expenseForm.recurrenceWeeklyDays || []).includes(
                        day.value,
                      )
                        ? "border-indigo-500 bg-indigo-500 text-white shadow-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-500 dark:text-white"
                        : day.value === 0
                          ? "border-gray-300 bg-white text-red-500 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-500 dark:bg-slate-700 dark:text-red-400 dark:hover:border-indigo-400/70 dark:hover:bg-slate-600"
                          : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-indigo-400/70 dark:hover:bg-slate-600"
                    }`}
                    onClick={() => {
                      setExpenseForm((current) => {
                        const currentDays = Array.isArray(
                          current.recurrenceWeeklyDays,
                        )
                          ? current.recurrenceWeeklyDays
                          : [];
                        const hasDay = currentDays.includes(day.value);
                        const nextDays = hasDay
                          ? currentDays.filter((value) => value !== day.value)
                          : [...currentDays, day.value].sort((a, b) => a - b);

                        return {
                          ...current,
                          recurrenceWeeklyDays: nextDays.length
                            ? nextDays
                            : [day.value],
                        };
                      });
                    }}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-slate-300">
                Selected days:{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedWeeklyDaysLabel}
                </span>
              </p>
            </div>
          ) : null}

          {expenseForm.recurrenceFrequency === "monthly" ? (
            <div className="rounded-xl border border-gray-300 bg-white p-4 dark:border-slate-600 dark:bg-slate-700/50">
              <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-slate-200">
                Repeat Pattern
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                    (expenseForm.recurrenceMonthlyPattern || "date") === "date"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-300"
                      : "border-gray-400 text-gray-500 dark:border-slate-500 dark:text-slate-300"
                  }`}
                  onClick={() =>
                    setExpenseForm((current) => ({
                      ...current,
                      recurrenceMonthlyPattern: "date",
                    }))
                  }
                >
                  Repeat on the same date
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    (expenseForm.recurrenceMonthlyPattern || "date") ===
                    "weekday"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-300"
                      : "border-gray-400 text-gray-500 dark:border-slate-500 dark:text-slate-300"
                  }`}
                  onClick={() =>
                    setExpenseForm((current) => ({
                      ...current,
                      recurrenceMonthlyPattern: "weekday",
                    }))
                  }
                >
                  Repeat on weekday pattern
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    (expenseForm.recurrenceMonthlyPattern || "date") ===
                    "custom"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-300"
                      : "border-gray-400 text-gray-500 dark:border-slate-500 dark:text-slate-300"
                  }`}
                  onClick={() =>
                    setExpenseForm((current) => ({
                      ...current,
                      recurrenceMonthlyPattern: "custom",
                    }))
                  }
                >
                  Select dates to repeat
                </button>
              </div>
            </div>
          ) : null}

          {expenseForm.recurrenceFrequency === "yearly" ? (
            <div className="rounded-xl border border-gray-300 bg-white p-4 dark:border-slate-600 dark:bg-slate-700/50">
              <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-slate-200">
                Repeat Pattern
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                    (expenseForm.recurrenceYearlyPattern || "date") === "date"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-300"
                      : "border-gray-400 text-gray-500 dark:border-slate-500 dark:text-slate-300"
                  }`}
                  onClick={() =>
                    setExpenseForm((current) => ({
                      ...current,
                      recurrenceYearlyPattern: "date",
                    }))
                  }
                >
                  Repeat on same day-month
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    (expenseForm.recurrenceYearlyPattern || "date") ===
                    "weekday"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-300"
                      : "border-gray-400 text-gray-500 dark:border-slate-500 dark:text-slate-300"
                  }`}
                  onClick={() =>
                    setExpenseForm((current) => ({
                      ...current,
                      recurrenceYearlyPattern: "weekday",
                    }))
                  }
                >
                  Repeat on weekday pattern
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    (expenseForm.recurrenceYearlyPattern || "date") === "custom"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-300"
                      : "border-gray-400 text-gray-500 dark:border-slate-500 dark:text-slate-300"
                  }`}
                  onClick={() =>
                    setExpenseForm((current) => ({
                      ...current,
                      recurrenceYearlyPattern: "custom",
                    }))
                  }
                >
                  Select months to repeat
                </button>
              </div>
            </div>
          ) : null}

          {expenseForm.recurrenceFrequency ? (
            <div className="rounded-xl border border-gray-300 bg-white p-4 dark:border-slate-600 dark:bg-slate-700/50">
              <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-slate-200">
                Duration
              </p>
              <div className="overflow-hidden rounded-xl border border-gray-300 dark:border-slate-600">
                <label className="flex cursor-pointer items-center gap-3 border-b border-gray-300 px-4 py-4 text-base text-gray-800 dark:border-slate-600 dark:text-slate-100">
                  <input
                    type="radio"
                    name="recurrenceDuration"
                    value="forever"
                    checked={
                      (expenseForm.recurrenceDuration || "until") === "forever"
                    }
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        recurrenceDuration: event.target.value,
                      }))
                    }
                    className="h-5 w-5 accent-indigo-500"
                  />
                  <span>Forever</span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 border-b border-gray-300 px-4 py-4 text-base text-gray-800 dark:border-slate-600 dark:text-slate-100">
                  <input
                    type="radio"
                    name="recurrenceDuration"
                    value="count"
                    checked={
                      (expenseForm.recurrenceDuration || "until") === "count"
                    }
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        recurrenceDuration: event.target.value,
                      }))
                    }
                    className="h-5 w-5 accent-indigo-500"
                  />
                  {(expenseForm.recurrenceDuration || "until") === "count" ? (
                    <span className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={expenseForm.recurrenceCount || ""}
                        onFocus={() =>
                          setExpenseForm((current) => ({
                            ...current,
                            recurrenceDuration: "count",
                          }))
                        }
                        onChange={(event) =>
                          setExpenseForm((current) => ({
                            ...current,
                            recurrenceDuration: "count",
                            recurrenceCount: event.target.value,
                          }))
                        }
                        placeholder="10"
                        className="w-14 border-b border-gray-400 bg-transparent px-1 pb-0.5 text-center text-base font-semibold text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none dark:border-slate-400 dark:text-white"
                      />
                      <span>times total</span>
                    </span>
                  ) : (
                    <span>Specific number of times</span>
                  )}
                </label>

                <label className="flex cursor-pointer items-center gap-3 px-4 py-4 text-base text-gray-800 dark:text-slate-100">
                  <input
                    type="radio"
                    name="recurrenceDuration"
                    value="until"
                    checked={
                      (expenseForm.recurrenceDuration || "until") === "until"
                    }
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        recurrenceDuration: event.target.value,
                      }))
                    }
                    className="h-5 w-5 accent-indigo-500"
                  />
                  <span>Until</span>
                </label>
              </div>
            </div>
          ) : null}

          {expenseForm.recurrenceFrequency &&
          (expenseForm.recurrenceDuration || "until") === "until" ? (
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                Repeat Until
              </span>
              <Calendar
                className="min-h-13 rounded-xl border border-gray-300 bg-white px-4 text-lg text-gray-900 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-700/80 dark:text-white"
                expenses={[]}
                value={expenseForm.recurrenceEndDate || ""}
                onChange={(event) =>
                  setExpenseForm((current) => ({
                    ...current,
                    recurrenceEndDate: event.target.value,
                  }))
                }
              />
            </label>
          ) : null}
        </div>

        {isEditingExpense ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="plain"
              className={updateButtonClasses}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Update Expense"}
            </Button>
            <Button
              variant="plain"
              className={cancelButtonClasses}
              type="button"
              onClick={handleCancelEditExpense}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="plain"
            className={submitButtonClasses}
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Add Expense"}
          </Button>
        )}
      </form>

      {showScanUnderDevelopmentPopup ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4"
          onClick={() => setShowScanUnderDevelopmentPopup(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby="scan-receipt-popup-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="scan-receipt-popup-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Feature Under Development
            </h3>
            <p className="mt-2 text-base text-gray-600 dark:text-slate-200">
              Receipt scanning is under development and will be available soon.
            </p>
            <div className="mt-5 flex justify-end">
              <Button
                variant="plain"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
                type="button"
                onClick={() => setShowScanUnderDevelopmentPopup(false)}
              >
                Okay
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showRecurrenceUnderDevelopmentPopup ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4"
          onClick={() => setShowRecurrenceUnderDevelopmentPopup(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recurrence-popup-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="recurrence-popup-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Feature Under Development
            </h3>
            <p className="mt-2 text-base text-gray-600 dark:text-slate-200">
              Recurrence controls are under development for deployment and will
              be available soon.
            </p>
            <div className="mt-5 flex justify-end">
              <Button
                variant="plain"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
                type="button"
                onClick={() => setShowRecurrenceUnderDevelopmentPopup(false)}
              >
                Okay
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PanelCard>
  );
}
