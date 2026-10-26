import { useMemo } from "react";
import {
  buildBubbleLayout,
  calculateCategoryPanelsHeight,
} from "../../utils/analytics";

export default function useBubbleLayout({
  visibleCategories,
  bubbleBoardSize,
  totalCategoryAmount,
}) {

  const bubblePanelHeight = useMemo(
  () => calculateCategoryPanelsHeight(
    bubbleBoardSize.width,
    visibleCategories.length,
  ),
  [bubbleBoardSize.width, visibleCategories.length],
);

  const bubbleLayout = useMemo(
    () =>
      buildBubbleLayout(
        visibleCategories,
        bubbleBoardSize.width,
        bubbleBoardSize.height,
        totalCategoryAmount,
        false
      ),
    [visibleCategories, bubbleBoardSize, totalCategoryAmount]
  );

  return {
    bubblePanelHeight,
    bubbleLayout,
  };
}