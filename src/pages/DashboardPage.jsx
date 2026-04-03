import {
  CATEGORY_COLORS,
  CATEGORY_GROUPS,
  CATEGORY_OPTIONS,
} from "../lib/categoryConfig";
import Calendar from "../components/calendar";
import useDashboardPage from "../hooks/useDashboardPage";

const shellClasses =
  "rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5 dark:bg-slate-800/95 dark:ring-white/5 md:p-6";
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

export default function DashboardPage({
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
  } = useDashboardPage({
    expenses,
    expenseForm,
    setExpenseForm,
    isEditingExpense,
  });

  return (
    <section className={`${shellClasses} mx-auto w-full max-w-190`}>
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
          {isEditingExpense ? "Edit Expense" : "Add New Expense"}
        </h2>
        <button className={scanButtonClasses} type="button">
          <i className="fas fa-camera" aria-hidden="true" />
          <span>Scan Receipt</span>
        </button>
      </div>

      <form className="grid gap-7" onSubmit={handleAddExpense}>
        <div className="grid gap-4 md:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="relative" ref={categoryDropdownRef}>
            <button
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
                        CATEGORY_COLORS[selectedCategory.value] || CATEGORY_COLORS.uncategorized,
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
            </button>

            <select
              className="sr-only"
              value={expenseForm.category}
              onChange={(event) => {
                setCategoryManuallySelected(true);
                setExpenseForm((current) => ({ ...current, category: event.target.value }));
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
                          CATEGORY_COLORS[option.value] || CATEGORY_COLORS.uncategorized;
                        const isSelected = expenseForm.category === option.value;

                        return (
                          <button
                            className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                              isSelected
                                ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-500/25 dark:text-white"
                                : "text-gray-700 hover:bg-gray-100 dark:text-slate-100 dark:hover:bg-slate-700/80"
                            }`}
                            key={option.value}
                            type="button"
                            onClick={() => handleCategorySelection(option.value)}
                          >
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm text-white"
                              style={{ backgroundColor: optionColor }}
                            >
                              <i className={option.icon} aria-hidden="true" />
                            </span>
                            <span className="truncate">{option.label}</span>
                          </button>
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
              setExpenseForm((current) => ({ ...current, title: event.target.value }))
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
            setExpenseForm((current) => ({ ...current, amount: event.target.value }))
          }
          required
          placeholder="Amount"
        />

        <Calendar
          className="min-h-13 rounded-xl border border-gray-300 bg-white px-4 text-lg text-gray-900 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-700/80 dark:text-white"
          expenses={expenses}
          value={expenseForm.date}
          onChange={(event) =>
            setExpenseForm((current) => ({ ...current, date: event.target.value }))
          }
        />

        {isEditingExpense ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button className={updateButtonClasses} type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Update Expense"}
            </button>
            <button
              className={cancelButtonClasses}
              type="button"
              onClick={handleCancelEditExpense}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button className={submitButtonClasses} type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Add Expense"}
          </button>
        )}
      </form>
    </section>
  );
}
