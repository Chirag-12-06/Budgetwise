import PanelCard from "../ui/PanelCard";
import { getContrastTextColor, hexToRgba } from "../../utils/color";
import { formatCurrency } from "../../utils/currency";
import {
  useBubbleVisibility,
  useBubbleBoardSize,
  useBubbleLayout,
} from "../../hooks/analytics";
export default function CategoryBubbleChart({
  categoryEntries,
  categories,
  isDarkMode,
  reportingCurrency,
}) {
  const { visibleCategories } = useBubbleVisibility(categoryEntries);
  const { bubbleBoardSize, bubbleBoardRef } = useBubbleBoardSize();
  const { bubblePanelHeight, bubbleLayout } = useBubbleLayout({
    visibleCategories,
    bubbleBoardSize,
    categoryEntries,
  });
  return (
    <PanelCard>
      {categoryEntries.length ? (
        <div className="pt-3">
          <div
            className="relative w-full overflow-hidden rounded-2xl"
            ref={bubbleBoardRef}
            style={{ height: `${bubblePanelHeight}px` }}
          >
            <div
              className="pointer-events-none absolute left-4 top-3 text-sm font-semibold tracking-wide"
              style={{ color: isDarkMode ? "#e5e7eb" : "#1f2937" }}
            >
              Category Share
            </div>

            {visibleCategories.length ? (
              bubbleLayout.map((bubble) => {
                const category = categories.find(
                  (option) => option.id === bubble.categoryKey,
                );

                const bubbleColor = category?.color;
                const textColor = getContrastTextColor(bubbleColor);
                const badgeLabel = `${bubble.percent.toFixed(1)}%`;

                const estimatedFontSizePx = Math.floor(
                  (bubble.diameter * 0.78) /
                    Math.max(1, badgeLabel.length * 0.56),
                );

                const badgeFontSizePx = Math.max(
                  11,
                  Math.min(36, estimatedFontSizePx),
                );

                return (
                  <div
                    key={bubble.categoryKey}
                    className="floating-bubble absolute flex items-center justify-center rounded-full text-center"
                    style={{
                      left: `${Math.round(bubble.x)}px`,
                      top: `${Math.round(bubble.y)}px`,
                      width: `${Math.round(bubble.diameter)}px`,
                      height: `${Math.round(bubble.diameter)}px`,
                      backgroundColor: bubbleColor,
                      border: `2px solid ${hexToRgba(bubbleColor, 0.95)}`,
                      color: textColor,
                      animationDuration: `${bubble.animationDuration}s`,
                      animationDelay: `${bubble.animationDelay}s`,
                    }}
                    title={`${category?.name}: ${formatCurrency(bubble.value, reportingCurrency)} (${bubble.percent.toFixed(1)}%)`}
                  >
                    <span
                      className="pointer-events-none inline-block max-w-full whitespace-nowrap font-bold leading-none"
                      style={{
                        fontSize: `${badgeFontSizePx}px`,
                        lineHeight: 1,
                      }}
                    >
                      {badgeLabel}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 dark:text-gray-300">
                All categories are hidden. Click a category in the legend to
                show it again.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-6 text-gray-500 dark:text-gray-300">
          No category data available for the selected range.
        </div>
      )}
    </PanelCard>
  );
}
