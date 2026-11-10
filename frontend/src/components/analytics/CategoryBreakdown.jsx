import { PanelCard, Button } from "../ui";
import { formatCurrency } from "../../utils/currency";
import {
  useBubbleVisibility,
  useBubbleBoardSize,
  useBubbleLayout,
} from "../../hooks/analytics";

export default function CategoryBreakdown({
  categoryEntries,
  categories,
  reportingCurrency,
}) {
  const { hiddenBubbleCategories, visibleCategories, toggleBubbleCategory } =
    useBubbleVisibility(categoryEntries);
  const { bubbleBoardSize } = useBubbleBoardSize();
  const { bubblePanelHeight, totalCategoryAmount } = useBubbleLayout({
    visibleCategories,
    bubbleBoardSize,
    categoryEntries,
  });
  return (
    <PanelCard>
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
        <div>
          <h3>Category Breakdown</h3>
        </div>
      </div>

      {categoryEntries.length ? (
        <div
          className="overflow-y-auto overscroll-y-contain pr-1 hide-scrollbar"
          style={{
            minHeight: `${bubblePanelHeight}px`,
            maxHeight: `${bubblePanelHeight}px`,
          }}
        >
          {categoryEntries.map(([categoryKey, total]) => {
            const category = categories.find((item) => item.id === categoryKey);

            const color = category?.color;

            const percent = totalCategoryAmount
              ? (total / totalCategoryAmount) * 100
              : 0;

            const isHidden = hiddenBubbleCategories.includes(categoryKey);

            return (
              <Button
                key={categoryKey}
                variant="plain"
                type="button"
                className={`grid gap-2 rounded-lg p-2 text-left transition-colors ${
                  isHidden
                    ? "opacity-45"
                    : "opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => toggleBubbleCategory(categoryKey)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: color }}
                    >
                      <i className={category?.icon} aria-hidden="true" />
                    </span>

                    <strong className="truncate">{category?.name}</strong>
                  </div>

                  <span>{formatCurrency(total, reportingCurrency)}</span>
                </div>

                <div className="h-[0.7rem] w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-[inherit]"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </Button>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-gray-500 dark:text-gray-300">
          No category data available yet.
        </div>
      )}
    </PanelCard>
  );
}
