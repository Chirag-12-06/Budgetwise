import { useState, useRef } from "react";
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

function getNextDateKey(dateKey) {
  const [year, month, day] = String(dateKey || "")
    .split("-")
    .map((value) => Number(value));
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return "";
  }

  const nextDate = new Date(year, month - 1, day + 1);
  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
  const nextDay = String(nextDate.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

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

function normalizeReceiptMoney(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const asNumber = Number(String(value).replace(/[^0-9.-]/g, ""));
  if (Number.isFinite(asNumber)) {
    return asNumber;
  }
  return 0;
}

function resolveReceiptItemAmount(item) {
  if (!item || typeof item !== "object") {
    return 0;
  }

  const finalAmount = normalizeReceiptMoney(item.final_item_amount);
  if (finalAmount) {
    return finalAmount;
  }

  const baseAmount = normalizeReceiptMoney(item.base_amount);
  if (baseAmount) {
    return baseAmount;
  }

  const unitPrice = normalizeReceiptMoney(item.unit_price);
  const quantity = normalizeReceiptMoney(item.quantity || 1);
  if (unitPrice) {
    return unitPrice * (quantity || 1);
  }

  return 0;
}

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
  const isFormLocked =
    isEditingExpense || isEditingRecurringSeries || isEditingFuture;
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
    isEditingExpense: isFormLocked,
  });

  const [scanError, setScanError] = useState("");
  const [scanErrorOpen, setScanErrorOpen] = useState(false);
  const [showScanUnderDevelopmentPopup, setShowScanUnderDevelopmentPopup] = useState(false);
  const fileInputRef = useRef(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptBill, setReceiptBill] = useState(null);
  const [receiptPaidMap, setReceiptPaidMap] = useState({});
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [tempRecurring, setTempRecurring] = useState(recurringForm);

showScanUnderDevelopmentPopup

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
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async () => {
              try {
                const dataUrl = reader.result;
                const resp = await fetch("/api/process-receipt", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    image_b64: dataUrl,
                    filename: file.name,
                  }),
                });
                const json = await resp.json();
                if (!resp.ok || json?.error) {
                  const message = json?.error || "Receipt processing failed.";
                  setScanError(String(message));
                  setScanErrorOpen(true);
                  return;
                }

                const bill =
                  json?.data?.bills && json.data.bills[0]
                    ? json.data.bills[0]
                    : null;
                const items = Array.isArray(bill?.items) ? bill.items : [];
                const paidMap = {};
                items.forEach((_, index) => {
                  paidMap[String(index)] = true;
                });
                
                setReceiptBill(bill);
                setReceiptPaidMap(paidMap);
                setReceiptDialogOpen(true);
              } catch (err) {
                console.error("Upload failed", err);
                setScanError("Upload failed. Please try again.");
                setScanErrorOpen(true);
              }
            };
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />

        <Button
          variant="plain"
          className={scanButtonClasses}
          type="button"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          <i className="fas fa-camera" aria-hidden="true" />
          <span>Scan Receipt</span>
        </Button>
      </div>

      {receiptDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4"
          onClick={() => setReceiptDialogOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-scan-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="receipt-scan-dialog-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              {receiptBill?.restaurant_name || "Receipt"}
            </h3>

            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-600">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-slate-700/60 dark:text-slate-200">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                  {(Array.isArray(receiptBill?.items) ? receiptBill.items : [])
                    .length ? (
                    (receiptBill.items || []).map((item, index) => {
                      const amount = resolveReceiptItemAmount(item);
                      const key = String(index);
                      const isPaid = Boolean(receiptPaidMap[key]);

                      return (
                        <tr
                          key={key}
                          className="text-gray-800 dark:text-slate-100"
                        >
                          <td className="px-3 py-2">
                            {item?.name || "(unnamed)"}
                          </td>
                          <td className="px-3 py-2">{item?.quantity ?? ""}</td>
                          <td className="px-3 py-2">
                            {item?.unit_price ?? ""}
                          </td>
                          <td className="px-3 py-2">
                            {amount ? amount.toFixed(2) : ""}
                          </td>
                          <td className="px-3 py-2">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isPaid}
                                onChange={(event) => {
                                  const checked = event.target.checked;
                                  setReceiptPaidMap((current) => ({
                                    ...current,
                                    [key]: checked,
                                  }));
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-slate-200">
                                {isPaid ? "Paid" : "Not paid"}
                              </span>
                            </label>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        className="px-3 py-4 text-sm text-gray-600 dark:text-slate-200"
                        colSpan={5}
                      >
                        No items detected on this receipt.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="plain"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                type="button"
                onClick={() => setReceiptDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="plain"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
                type="button"
                onClick={() => {
                  const items = Array.isArray(receiptBill?.items)
                    ? receiptBill.items
                    : [];
                  const selectedTotal = items.reduce((sum, item, index) => {
                    const key = String(index);
                    if (!receiptPaidMap[key]) return sum;
                    return sum + resolveReceiptItemAmount(item);
                  }, 0);

                  const restaurantName = receiptBill?.restaurant_name || "";
                  setExpenseForm((current) => ({
                    ...current,
                    title: restaurantName ? restaurantName : current.title,
                    amount: selectedTotal
                      ? selectedTotal.toFixed(2)
                      : current.amount,
                  }));
                  setReceiptDialogOpen(false);
                }}
              >
                Use selection
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <UnderDevelopmentDialog
        open={scanErrorOpen}
        title="Receipt scan failed"
        message={scanError || "Please try again."}
        onClose={() => setScanErrorOpen(false)}
        labelledBy="receipt-scan-error-dialog"
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

      <UnderDevelopmentDialog
        open={showScanUnderDevelopmentPopup}
        title="Feature Under Development"
        message="Receipt scanning is under development and will be available soon."
        labelledBy="scan-receipt-popup-title"
        onClose={() => setShowScanUnderDevelopmentPopup(false)}
      />

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
