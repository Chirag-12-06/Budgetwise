import { useEffect, useMemo, useState } from "react";

export default function useBubbleVisibility(chartCategories) {
  const [hiddenBubbleCategories, setHiddenBubbleCategories] = useState([]);

  useEffect(() => {
    setHiddenBubbleCategories((current) =>
      current.filter((categoryKey) =>
        chartCategories.some(([key]) => key === categoryKey)
      )
    );
  }, [chartCategories]);

  function toggleBubbleCategory(categoryKey) {
    setHiddenBubbleCategories((current) =>
      current.includes(categoryKey)
        ? current.filter((value) => value !== categoryKey)
        : [...current, categoryKey]
    );
  }

  const visibleCategories = useMemo(
    () =>
      chartCategories.filter(
        ([key]) => !hiddenBubbleCategories.includes(key)
      ),
    [chartCategories, hiddenBubbleCategories]
  );

  return {
    hiddenBubbleCategories,
    visibleCategories,
    toggleBubbleCategory,
  };
}