import { useState } from "react"


export default function useCategoryFilters() {

  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState([]);


  function handleCategoryFilterToggle(categoryValue) {
    const normalizedValue = categoryValue || "uncategorized";
    setSelectedCategoryFilters((current) =>
      current.includes(normalizedValue)
        ? current.filter((value) => value !== normalizedValue)
        : [...current, normalizedValue],
    );
  }

  function clearCategoryFilters() {
    setSelectedCategoryFilters([]);
  }
  return {
    selectedCategoryFilters,
    setSelectedCategoryFilters,
    handleCategoryFilterToggle,
    clearCategoryFilters,
  };
}