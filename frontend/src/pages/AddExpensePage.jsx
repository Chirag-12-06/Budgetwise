import { useState } from "react";

import ReceiptDialog from "../components/receipt/ReceiptDialog";
import Button from "../components/ui/Button";
import Calendar from "../components/ui/Calendar";
import PanelCard from "../components/ui/PanelCard";

import { CURRENCY_OPTIONS } from "../constants/currencies";

import useExpenseCategory from "../hooks/expenses/useExpenseCategory";
import useReceiptScanner from "../hooks/receipt/useReceiptScanner";
import useCategories from "../hooks/useCategory";
import useExpenses from "../hooks/expenses/useExpenses";

import resolveReceiptItemAmount from "../utils/receiptItemAmount";

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

export default function AddExpensePage() {
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const {
    expenses,
    expenseForm,
    setExpenseForm,
    handleAddExpense,
    submitting,
    isEditingExpense,
    handleCancelEditExpense,
  } = useExpenses();

  const { categories, groups } = useCategories();

  const categoryGroups = (groups ?? []).map((group) => ({
    ...group,
    options: (categories ?? []).filter(
      (category) => category.groupId === group.id,
    ),
  }));

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

  const {
    fileInputRef,
    receiptBill,
    receiptPaidMap,
    receiptDialogOpen,
    setReceiptDialogOpen,
    isScanning,
    handleReceiptScan,
    toggleReceiptItem,
    applyReceiptSelection,
  } = useReceiptScanner({ setExpenseForm });

  const currentCurrency =
    CURRENCY_OPTIONS.find(
      (currency) => currency.code === (expenseForm.currencyCode || "INR"),
    ) || CURRENCY_OPTIONS[0];

  return (
    <PanelCard variant="addExpense" className="mx-auto w-full max-w-190">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
          {isEditingExpense ? "Edit Expense" : "Add New Expense"}
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
                      style={{
                        backgroundColor: selectedCategory.color,
                      }}
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
                  className={`fas ${
                    isCategoryMenuOpen ? "fa-chevron-up" : "fa-chevron-down"
                  } shrink-0 text-sm text-gray-500 dark:text-slate-300`}
                  aria-hidden="true"
                />
              </Button>

              <select
                className="sr-only"
                value={expenseForm.category}
                onChange={(event) =>
                  handleCategorySelection(event.target.value)
                }
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
                                style={{
                                  backgroundColor: option.color,
                                }}
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
              <div className="absolute left-0 top-full z-50 mt-2 max-h-60 w-36 overflow-y-auto rounded-lg border bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
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
    </PanelCard>
  );
}
