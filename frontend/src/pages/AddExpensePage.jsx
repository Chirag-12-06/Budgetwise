import { useState } from "react";
import Button from "../components/ui/button";
import Calendar from "../components/ui/calendar";
import PanelCard from "../components/ui/panelCard";
import useCategoryPrediction from "../hooks/expenses/useCategoryPrediction";
import useExpenseCategory from "../hooks/expenses/useExpenseCategory";
import useCategories from "../hooks/useCategory";
import { getNextDateKey } from "../utils/date";
import resolveReceiptItemAmount from "../utils/receiptItemAmount";
import useReceiptScanner from "../hooks/receipt/useReceiptScanner";
import ReceiptDialog from "../components/receipt/ReceiptDialog";
import { CURRENCY_OPTIONS } from "../constants/currencies";

const fieldClasses =
  "h-13 w-full rounded-xl border border-gray-300 bg-white px-4 text-lg text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700/80 dark:text-white dark:placeholder:text-slate-300";

function frequencyLabel(frequency, count) {
  const n = Number(count);
  const plural = n > 1;
  switch (frequency) {
    case "DAILY":
      return plural ? "days" : "day";
    case "WEEKLY":
      return plural ? "weeks" : "week";
    case "MONTHLY":
      return plural ? "months" : "month";
    case "YEARLY":
      return plural ? "years" : "year";
    default:
      return frequency.toLowerCase();
  }
}

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
  isEditingFuture,
  isEditingRecurringSeries,
  handleCancelEditExpense,
  handleCancelEditRecurringExpense,
}) {
  const [showScanUnderDevelopmentPopup, setShowScanUnderDevelopmentPopup] =
    useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [tempRecurring, setTempRecurring] = useState(recurringForm);
  const { categories, groups } = useCategories();

  const categoryGroups = (groups ?? []).map((group) => ({
    ...group,
    options: (categories ?? []).filter(
      (category) => category.groupId === group.id,
    ),
  }));

  const isFormLocked =
    isEditingExpense || isEditingRecurringSeries || isEditingFuture;
  const {
    isCategoryMenuOpen,
    setIsCategoryMenuOpen,
    categoryDropdownRef,
    selectedCategory,
    handleCategorySelection,
  } = useExpenseCategory({
    categories,
    expenseForm,
    setExpenseForm,
    isEditingExpense,
  });

  useCategoryPrediction({
    expenses,
    expenseForm,
    setExpenseForm,
    isEditingExpense: isFormLocked,
    // categoryManuallySelected,
  });

  const {
    fileInputRef,
    receiptBill,
    receiptPaidMap,
    receiptDialogOpen,
    setReceiptDialogOpen,
    scanError,
    scanErrorOpen,
    setScanErrorOpen,
    isScanning,
    handleReceiptScan,
    toggleReceiptItem,
    applyReceiptSelection,
  } = useReceiptScanner({ setExpenseForm });

  showScanUnderDevelopmentPopup;
  const currentCurrency =
    CURRENCY_OPTIONS.find(
      (currency) => currency.code === (expenseForm.currencyCode || "INR"),
    ) || CURRENCY_OPTIONS[0];
  const recurringUntilDateMin = getNextDateKey(expenseForm.date);
  const recurringUntilDateIsInvalid =
    recurringForm.enabled &&
    recurringForm.endType === "UNTIL_DATE" &&
    Boolean(recurringForm.endDate) &&
    Boolean(expenseForm.date) &&
    recurringForm.endDate <= expenseForm.date;
  const showRecurringSection =
    !isEditingExpense || isEditingRecurringSeries || isEditingFuture;
  const showRecurringFields = recurringForm.enabled && showRecurringSection;

  const handleRecurringToggle = () => {
    // Open modal; do not persist until Save. If it was disabled, pre-check enabled in temp state
    if (!recurringForm.enabled) {
      setTempRecurring({ ...recurringForm, enabled: true });
    } else {
      setTempRecurring(recurringForm);
    }
    setShowRecurringModal(true);
  };

  const displayRecurringEnabled = showRecurringModal
    ? Boolean(tempRecurring && tempRecurring.enabled)
    : Boolean(recurringForm && recurringForm.enabled);

  return (
    <PanelCard variant="addExpense" className="mx-auto w-full max-w-190">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
          {isEditingExpense || isEditingRecurringSeries || isEditingFuture
            ? "Edit Expense"
            : "Add New Expense"}
        </h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleReceiptScan}
        />

        <Button
          variant="plain"
          className={scanButtonClasses}
          type="button"
          disabled={isScanning}
          onClick={() => fileInputRef.current?.click()}
        >
          <i className="fas fa-camera" aria-hidden="true" />
          <span>{isScanning ? "Scanning..." : "Scan Receipt"}</span>
        </Button>
      </div>

      <ReceiptDialog
        isOpen={receiptDialogOpen}
        receiptBill={receiptBill}
        receiptPaidMap={receiptPaidMap}
        onClose={() => setReceiptDialogOpen(false)}
        onToggleItem={toggleReceiptItem}
        onApply={() => applyReceiptSelection(resolveReceiptItemAmount)}
        resolveReceiptItemAmount={resolveReceiptItemAmount}
      />

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
                      style={{ backgroundColor: selectedCategory.color }}
                    >
                      <i className={selectedCategory.icon} aria-hidden="true" />
                    </span>
                    <span className="text-base">{selectedCategory.name}</span>
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
                  handleCategorySelection(event.target.value);
                }}
                required
                tabIndex={-1}
                aria-hidden="true"
              >
                <option value="" disabled>
                  Category
                </option>

                {categories.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>

              {isCategoryMenuOpen && (
                <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-2xl backdrop-blur dark:border-slate-600 dark:bg-slate-800/95">
                  {categoryGroups.map((group) => (
                    <section
                      className="border-b border-gray-200 py-1.5 last:border-b-0 dark:border-slate-600/70"
                      key={group.id}
                    >
                      <p className="px-2 pb-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-slate-300">
                        {group.name}
                      </p>

                      <div className="grid gap-1">
                        {group.options.map((option) => {
                          const isSelected = expenseForm.category === option.id;

                          return (
                            <Button
                              key={option.id}
                              variant="plain"
                              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-500/25 dark:text-white"
                                  : "text-gray-700 hover:bg-gray-100 dark:text-slate-100 dark:hover:bg-slate-700/80"
                              }`}
                              type="button"
                              onClick={() => handleCategorySelection(option.id)}
                            >
                              <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm text-white"
                                style={{ backgroundColor: option.color }}
                              >
                                <i className={option.icon} aria-hidden="true" />
                              </span>

                              <span className="truncate">{option.name}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
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

        <div className="flex gap-2">
          {/* Currency selector */}
          <div className="relative w-36 shrink-0">
            <button
              type="button"
              className={`${fieldClasses} flex h-full w-full items-center justify-between gap-2`}
              onClick={() => setCurrencyOpen((previous) => !previous)}
            >
              <span className="flex items-center gap-4">
                <img
                  src={currentCurrency.flag}
                  alt={currentCurrency.name}
                  className="h-6 w-10 rounded-sm object-cover"
                />
                <span>{currentCurrency.symbol}</span>
              </span>

              <i className="fas fa-chevron-down text-xs" />
            </button>

            {currencyOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 max-h-60 w-36 overflow-y-auto rounded-lg border bg-white dark:border-gray-600 dark:bg-gray-800 shadow-xl">
                {CURRENCY_OPTIONS.map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    className="flex w-full items-center gap-6 px-3 py-2 text-left dark:text-white dark:hover:bg-gray-700"
                    onClick={() => {
                      setExpenseForm((current) => ({
                        ...current,
                        currencyCode: currency.code,
                      }));
                      setCurrencyOpen(false);
                    }}
                  >
                    <img
                      src={currency.flag}
                      alt={currency.name}
                      className="h-6 w-10 rounded-sm object-cover"
                    />

                    <span>{currency.symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <i className="fas fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500" />

          {/* Amount input */}
          <input
            className={`${fieldClasses} min-w-0 flex-1`}
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
        </div>

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

        {showRecurringSection ? (
          <label className="grid gap-2">
            <Button
              variant="plain"
              type="button"
              onClick={handleRecurringToggle}
              aria-pressed={displayRecurringEnabled}
              aria-label={
                displayRecurringEnabled ? "Recurring" : "Don't Repeat"
              }
              title={displayRecurringEnabled ? "Recurring" : "Don't Repeat"}
              className={`${fieldClasses} flex items-center gap-2 px-3 text-left ${displayRecurringEnabled ? "bg-indigo-600 text-white hover:bg-indigo-500" : ""}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm ${displayRecurringEnabled ? "bg-white text-indigo-600" : "bg-gray-200 text-gray-600 dark:bg-slate-600/90 dark:text-slate-200"}`}
              >
                <i className="fas fa-repeat" aria-hidden="true" />
              </span>
              <span
                className={`flex-1 min-w-0 text-base ${displayRecurringEnabled ? "text-white" : "text-gray-500 dark:text-slate-300"} text-left`}
              >
                {displayRecurringEnabled ? "Recurring" : "Don't Repeat"}
              </span>
              <i
                className={`fas ${displayRecurringEnabled ? "fa-chevron-up" : "fa-chevron-down"} shrink-0 text-sm text-gray-500 dark:text-slate-300`}
                aria-hidden="true"
              />
            </Button>

            {/* Recurring details are edited in a modal for a cleaner UX */}
          </label>
        ) : null}

        {isEditingFuture ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="plain"
              className={updateButtonClasses}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Update This & Future"}
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
        ) : isEditingRecurringSeries ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="plain"
              className={updateButtonClasses}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Update Series"}
            </Button>
            <Button
              variant="plain"
              className={cancelButtonClasses}
              type="button"
              onClick={handleCancelEditRecurringExpense}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        ) : isEditingExpense ? (
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

      {showRecurringModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4"
          onClick={() => setShowRecurringModal(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recurring-details-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="recurring-details-dialog-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Recurring
            </h3>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Repeat every
                </span>
                <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
                  <input
                    className={fieldClasses}
                    type="number"
                    min="1"
                    step="1"
                    value={tempRecurring.intervalValue}
                    onChange={(event) =>
                      setTempRecurring((current) => ({
                        ...current,
                        intervalValue: event.target.value,
                      }))
                    }
                  />
                  <select
                    className={fieldClasses}
                    value={tempRecurring.frequency}
                    onChange={(event) =>
                      setTempRecurring((current) => ({
                        ...current,
                        frequency: event.target.value,
                      }))
                    }
                  >
                    <option value="DAILY">
                      {frequencyLabel("DAILY", tempRecurring.intervalValue)}
                    </option>
                    <option value="WEEKLY">
                      {frequencyLabel("WEEKLY", tempRecurring.intervalValue)}
                    </option>
                    <option value="MONTHLY">
                      {frequencyLabel("MONTHLY", tempRecurring.intervalValue)}
                    </option>
                    <option value="YEARLY">
                      {frequencyLabel("YEARLY", tempRecurring.intervalValue)}
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Repeat ends
                </span>
                <div className="grid gap-0 rounded-2xl border border-gray-200 bg-white p-0 dark:border-slate-600 dark:bg-slate-700/70">
                  <label className="flex items-center gap-3 px-3 py-3 text-sm text-gray-800 dark:text-slate-100">
                    <input
                      type="radio"
                      name="recurring-end-type-modal"
                      value="FOREVER"
                      checked={tempRecurring.endType === "FOREVER"}
                      onChange={(event) =>
                        setTempRecurring((current) => ({
                          ...current,
                          endType: event.target.value,
                          endCount: "",
                          endDate: "",
                        }))
                      }
                    />
                    <span className="ml-2">Forever</span>
                  </label>

                  <label className="flex items-center gap-3 px-3 py-3 text-sm text-gray-800 dark:text-slate-100 border-t border-gray-200 dark:border-slate-600 group">
                    <input
                      type="radio"
                      name="recurring-end-type-modal"
                      value="COUNT"
                      checked={tempRecurring.endType === "COUNT"}
                      onChange={(event) =>
                        setTempRecurring((current) => ({
                          ...current,
                          endType: event.target.value,
                          endDate: "",
                        }))
                      }
                    />

                    {tempRecurring.endType === "COUNT" ? null : (
                      <span className="flex-1 min-w-0 ml-2">
                        Specific number of times
                      </span>
                    )}

                    {tempRecurring.endType === "COUNT" ? (
                      <div className="ml-3 flex items-center gap-1 opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
                        <input
                          className="h-6 w-15  px-3 text-base text-gray-900 dark:text-white"
                          type="number"
                          min="1"
                          step="1"
                          value={tempRecurring.endCount}
                          onChange={(event) =>
                            setTempRecurring((current) => ({
                              ...current,
                              endType: "COUNT",
                              endCount: event.target.value,
                            }))
                          }
                          placeholder="1"
                        />
                        <span className="text-sm text-gray-500 dark:text-slate-300">
                          times total
                        </span>
                      </div>
                    ) : null}
                  </label>

                  <label className="flex items-start gap-3 px-3 py-3 text-sm text-gray-800 dark:text-slate-100 border-t border-gray-200 dark:border-slate-600">
                    <input
                      type="radio"
                      name="recurring-end-type-modal"
                      value="UNTIL_DATE"
                      checked={tempRecurring.endType === "UNTIL_DATE"}
                      onChange={(event) =>
                        setTempRecurring((current) => ({
                          ...current,
                          endType: event.target.value,
                          endCount: "",
                        }))
                      }
                      className="mt-1"
                    />
                    <span className="grid flex-1 gap-2">
                      Until
                      <Calendar
                        className="min-h-13 rounded-xl border border-gray-300 bg-white px-4 text-lg text-gray-900 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-700/80 dark:text-white"
                        value={tempRecurring.endDate}
                        minDate={recurringUntilDateMin}
                        onChange={(event) =>
                          setTempRecurring((current) => ({
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

            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="plain"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                type="button"
                onClick={() => {
                  setRecurringForm(tempRecurring);
                  setShowRecurringModal(false);
                }}
              >
                Save
              </Button>
              <Button
                variant="plain"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                type="button"
                onClick={() => setShowRecurringModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PanelCard>
  );
}
