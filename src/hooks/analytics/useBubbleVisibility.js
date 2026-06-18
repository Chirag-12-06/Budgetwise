import { useEffect, useMemo, useState } from "react";

export default function useBubbleVisibility(categoryEntries) {
  const [hiddenBubbleCategories, setHiddenBubbleCategories] = useState([]);

  useEffect(() => {
    setHiddenBubbleCategories((current) =>
      current.filter((categoryKey) =>
        categoryEntries.some(([key]) => key === categoryKey)
      )
    );
  }, [categoryEntries]);

  function toggleBubbleCategory(categoryKey) {
    setHiddenBubbleCategories((current) =>
      current.includes(categoryKey)
        ? current.filter((key) => key !== categoryKey)
        : [...current, categoryKey]
    );
  }

  const visibleCategories = useMemo(
    () =>
      categoryEntries.filter(
        ([key]) => !hiddenBubbleCategories.includes(key)
      ),
    [categoryEntries, hiddenBubbleCategories]
  );

  return {
    hiddenBubbleCategories,
    visibleCategories,
    toggleBubbleCategory,
  };
}