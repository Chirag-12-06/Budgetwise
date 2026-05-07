import { useState } from "react";
import {
  CATEGORY_COLORS,
  CATEGORY_GROUPS,
  CATEGORY_OPTIONS,
} from "../lib/categoryConfig";
import Button from "../components/button";
import Calendar from "../components/calendar";
import PanelCard from "../components/panelCard";
import UnderDevelopmentDialog from "../components/underDevelopmentDialog";
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

export default function AddExpensePage({
  expenses,
  expenseForm,
  setExpenseForm,
  recurringForm,
  setRecurringForm,
  handleAddExpense,
  submitting,
  isEditingExpense,
  handleCancelEditExpense,
}) {
  const {
    isCategoryMenuOpen,
    setIsCategoryMenuOpen,
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
  const [showRecurringUnderDevelopmentPopup, setShowRecurringUnderDevelopmentPopup] =
    useState(false);

  const isDeployed = typeof window !== "undefined" && !window.location.hostname.includes("localhost") && window.location.hostname !== "127.0.0.1";

  const handleRecurringToggle = () => {
    if (isDeployed) {
      setShowRecurringUnderDevelopmentPopup(true);
    } else {
      setRecurringForm((current) => ({
        ...current,
        enabled: !current.enabled,
        endCount: !current.enabled ? current.endCount : "",
        endDate: !current.enabled ? current.endDate : "",
      }));
    }
  };

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
        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <label className="grid gap-2">
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
          </label>

          <label className="grid gap-2">
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
          </label>
        </div>

        <label className="grid gap-2">
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
        </label>

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

        {!isEditingExpense ? (
          <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-slate-300">
                  Recurring expense
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                  Save this expense as a recurring template instead of a
                  one-time entry.
                </p>
              </div>
              <Button
                variant="plain"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${recurringForm.enabled ? "bg-indigo-600 text-white hover:bg-indigo-500" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"}`}
                type="button"
                onClick={handleRecurringToggle}
              >
                {recurringForm.enabled ? "Recurring on" : "Make recurring"}
              </Button>
            </div>

            {recurringForm.enabled ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                    Repeat every
                  </span>
                  <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
                    <input
                      className={fieldClasses}
                      type="number"
                      min="1"
                      step="1"
                      value={recurringForm.intervalValue}
                      onChange={(event) =>
                        setRecurringForm((current) => ({
                          ...current,
                          intervalValue: event.target.value,
                        }))
                      }
                    />
                    <select
                      className={fieldClasses}
                      value={recurringForm.frequency}
                      onChange={(event) =>
                        setRecurringForm((current) => ({
                          ...current,
                          frequency: event.target.value,
                        }))
                      }
                    >
                      <option value="DAILY">day(s)</option>
                      <option value="WEEKLY">week(s)</option>
                      <option value="MONTHLY">month(s)</option>
                      <option value="YEARLY">year(s)</option>
                    </select>
                  </div>
                </label>

                <div className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                    Repeat ends
                  </span>
                  <div className="grid gap-2 rounded-2xl border border-gray-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-700/70">
                    <label className="flex items-center gap-3 text-sm text-gray-800 dark:text-slate-100">
                      <input
                        type="radio"
                        name="recurring-end-type"
                        value="FOREVER"
                        checked={recurringForm.endType === "FOREVER"}
                        onChange={(event) =>
                          setRecurringForm((current) => ({
                            ...current,
                            endType: event.target.value,
                            endCount: "",
                            endDate: "",
                          }))
                        }
                      />
                      Forever
                    </label>
                    <label className="flex items-center gap-3 text-sm text-gray-800 dark:text-slate-100">
                      <input
                        type="radio"
                        name="recurring-end-type"
                        value="COUNT"
                        checked={recurringForm.endType === "COUNT"}
                        onChange={(event) =>
                          setRecurringForm((current) => ({
                            ...current,
                            endType: event.target.value,
                            endDate: "",
                          }))
                        }
                      />
                      <span className="flex flex-wrap items-center gap-2">
                        After
                        <input
                          className={`${fieldClasses} w-28`}
                          type="number"
                          min="1"
                          step="1"
                          value={recurringForm.endCount}
                          onChange={(event) =>
                            setRecurringForm((current) => ({
                              ...current,
                              endType: "COUNT",
                              endCount: event.target.value,
                            }))
                          }
                          placeholder="12"
                        />
                        occurrences
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-gray-800 dark:text-slate-100">
                      <input
                        type="radio"
                        name="recurring-end-type"
                        value="UNTIL_DATE"
                        checked={recurringForm.endType === "UNTIL_DATE"}
                        onChange={(event) =>
                          setRecurringForm((current) => ({
                            ...current,
                            endType: event.target.value,
                            endCount: "",
                          }))
                        }
                        className="mt-1"
                      />
                      <span className="grid flex-1 gap-2">
                        Until date
                        <input
                          className="min-h-13 rounded-xl border border-gray-300 bg-white px-4 text-lg text-gray-900 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-700/80 dark:text-white"
                          type="date"
                          value={recurringForm.endDate}
                          onChange={(event) =>
                            setRecurringForm((current) => ({
                              ...current,
                              endType: "UNTIL_DATE",
                              endDate: event.target.value,
                            }))
                          }
                        />
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

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

      <UnderDevelopmentDialog
        open={showScanUnderDevelopmentPopup}
        title="Feature Under Development"
        message="Receipt scanning is under development and will be available soon."
        labelledBy="scan-receipt-popup-title"
        onClose={() => setShowScanUnderDevelopmentPopup(false)}
      />

      <UnderDevelopmentDialog
        open={showRecurringUnderDevelopmentPopup}
        title="Feature Under Development"
        message="Recurring expenses feature is under development and will be available soon."
        labelledBy="recurring-popup-title"
        onClose={() => setShowRecurringUnderDevelopmentPopup(false)}
      />
    </PanelCard>
  );
}
