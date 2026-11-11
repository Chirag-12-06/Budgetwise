import { useState } from "react";

export default function useCategoryFilters() {
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState([]);

  function toggleCategoryFilter(categoryId) {
    const value = categoryId || "uncategorized";

    setSelectedCategoryFilters((current) =>
      current.includes(value)
        ? current.filter((id) => id !== value)
        : [...current, value],
    );
  }

  function clearCategoryFilters() {
    setSelectedCategoryFilters([]);
  }

  return {
    selectedCategoryFilters,
    setSelectedCategoryFilters,
    toggleCategoryFilter,
    clearCategoryFilters,
  };
}
