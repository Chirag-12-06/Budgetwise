import { useEffect } from "react";
import useExpenseCategory from "../../hooks/expenses/useExpenseCategory";
import useCategories from "../../hooks/useCategory";

export default function CategorySelector({ expenseForm }) {
  const {
    isCategoryMenuOpen,
    setIsCategoryMenuOpen,
    categoryDropdownRef,
    selectedCategory,
    handleCategorySelection,
  } = useExpenseCategory();

  const { categories, groups } = useCategories();

  const categoryGroups = (groups ?? []).map((group) => ({
    ...group,
    options: (categories ?? []).filter(
      (category) => category.groupId === group.id,
    ),
  }));

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setIsCategoryMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [categoryDropdownRef, setIsCategoryMenuOpen]);

  return (
    <div className="relative" ref={categoryDropdownRef}>
      <label className="mb-2 block text-lg font-medium text-gray-800 dark:text-gray-200">
        Category
      </label>

      <button
        type="button"
        onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
        className="flex h-13 w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 text-lg text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700/80 dark:text-white"
      >
        <span className="flex items-center gap-3">
          {selectedCategory ? (
            <>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: selectedCategory.color }}
              >
                <i
                  className={`${selectedCategory.icon} text-white`}
                  aria-hidden="true"
                />
              </span>
              <span>{selectedCategory.name}</span>
            </>
          ) : (
            <>
              <i className="fas fa-tags text-gray-500" aria-hidden="true" />
              <span className="text-gray-500 dark:text-slate-300">
                Select category
              </span>
            </>
          )}
        </span>

        <i
          className={`fas fa-chevron-down text-sm transition-transform ${
            isCategoryMenuOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <select
        required
        value={expenseForm.category || ""}
        onChange={(event) => handleCategorySelection(event.target.value)}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value="">Select category</option>
        {categoryGroups.map((group) =>
          group.options.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          )),
        )}
      </select>

      {isCategoryMenuOpen && (
        <div className="category-dropdown-scrollbar absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-slate-600 dark:bg-slate-800">
          {categoryGroups.map((group) => (
            <div key={group.id} className="mb-3 last:mb-0">
              <p className="px-3 py-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                {group.name}
              </p>

              {group.options.map((category) => {
                const isSelected = expenseForm.category === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategorySelection(category.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                        : "text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: category.color }}
                    >
                      <i
                        className={`${category.icon} text-white`}
                        aria-hidden="true"
                      />
                    </span>

                    <span className="flex-1">{category.name}</span>

                    {isSelected && (
                      <i
                        className="fas fa-check text-indigo-600 dark:text-indigo-400"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
