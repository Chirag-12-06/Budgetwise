import useCategory from "../../hooks/useCategory";
import useExpenses from "../../hooks/expenses/useExpenses";
import { Button } from "../ui";

export default function CategoryFilterPanel() {
  const { categories, groups } = useCategory();

  const {
    dateFilteredExpenses,
    selectedCategoryFilters,
    handleCategoryFilterToggle,
    clearCategoryFilters,
  } = useExpenses();

  // Only show categories that exist in the selected date range.
  const availableCategoryOptions = Array.from(
    new Set(
      dateFilteredExpenses.map((expense) => expense?.category).filter(Boolean),
    ),
  )
    .map((value) => {
      const category = categories.find((item) => item.id === value);

      return {
        value,
        label: category?.name || "Uncategorized",
        icon: category?.icon || null,
        color: category?.color || "#808080",
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  const availableCategorySet = new Set(
    availableCategoryOptions.map((option) => option.value),
  );

  const availableCategoryGroups = groups
    .map((group) => {
      const values = categories
        .filter(
          (category) =>
            category.groupId === group.id &&
            availableCategorySet.has(category.id),
        )
        .map((category) => category.id);

      if (!values.length) return null;

      const selectedCount = values.filter((value) =>
        selectedCategoryFilters.includes(value),
      ).length;

      const accentColor = categories.find(
        (option) => option.id === values[0],
      )?.color;

      return {
        label: group.name,
        values,
        selectedCount,
        isAllSelected: selectedCount === values.length,
        icon: group.icon || "fas fa-layer-group",
        accentColor,
      };
    })
    .filter(Boolean);

  const shouldConstrainGroupHeight = availableCategoryGroups.length > 3;
  const shouldConstrainCategoryHeight = availableCategoryOptions.length > 4;

  function handleCategoryGroupClick(groupValues) {
    const normalizedValues = [...new Set(groupValues)];

    const allSelected = normalizedValues.every((value) =>
      selectedCategoryFilters.includes(value),
    );

    normalizedValues.forEach((value) => {
      const currentlySelected = selectedCategoryFilters.includes(value);

      const shouldToggle = allSelected ? currentlySelected : !currentlySelected;

      if (shouldToggle) {
        handleCategoryFilterToggle(value);
      }
    });
  }

  return (
    <section className="grid h-full gap-2">
      {availableCategoryOptions.length ? (
        <div className="grid h-full grid-cols-[1fr_1.5fr] items-stretch gap-3">
          {/* Quick category groups */}
          {availableCategoryGroups.length > 0 && (
            <div className="grid min-w-0 self-stretch gap-0">
              <div className="mb-1 flex items-center px-1 sm:mb-0">
                <p className="text-[0.7rem] font-semibold uppercase leading-none tracking-[0.08em] text-gray-500 dark:text-gray-300">
                  Quick Groups
                </p>
              </div>

              <div
                className={`h-full min-h-full rounded-lg border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800 ${
                  shouldConstrainGroupHeight
                    ? "max-h-45 overflow-y-auto overscroll-y-contain"
                    : ""
                }`}
              >
                <div className="grid gap-2">
                  {availableCategoryGroups.map((group) => {
                    const progressPercent =
                      (group.selectedCount / group.values.length) * 100;

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

                        <span className="flex min-w-0 items-center gap-1.5">
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
                          style={{
                            width: `${progressPercent}%`,
                            backgroundColor: group.accentColor,
                          }}
                        />
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Individual categories */}
          <div className="grid min-w-0 self-stretch gap-0">
            <div className="mb-1 flex items-center justify-between gap-2 px-1 sm:mb-0">
              <p className="text-[0.7rem] font-semibold uppercase leading-none tracking-[0.08em] text-gray-500 dark:text-gray-300">
                Categories
              </p>

              {selectedCategoryFilters.length > 0 && (
                <Button
                  variant="plain"
                  className="text-[0.7rem] font-semibold uppercase leading-none tracking-[0.08em] text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                  type="button"
                  onClick={clearCategoryFilters}
                >
                  Clear
                </Button>
              )}
            </div>

            <div
              className={`h-full min-h-full rounded-lg border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800 ${
                shouldConstrainCategoryHeight
                  ? "max-h-45 overflow-y-auto overscroll-y-contain"
                  : ""
              }`}
            >
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {availableCategoryOptions.map((option) => (
                  <label
                    className="flex h-10 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/70"
                    key={option.value}
                  >
                    <input
                      checked={selectedCategoryFilters.includes(option.value)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      type="checkbox"
                      onChange={() => handleCategoryFilterToggle(option.value)}
                    />

                    <span
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white"
                      style={{ backgroundColor: option.color }}
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
        <p className="text-sm text-gray-500 dark:text-gray-300">
          No categories available yet.
        </p>
      )}
    </section>
  );
}
