import { useEffect, useState } from "react";
import { getCategories, getCategoryGroups } from "../api/category.api";

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);

        const [categoryResponse, groupResponse] = await Promise.all([
          getCategories(),
          getCategoryGroups(),
        ]);

        setCategories(categoryResponse);
        setGroups(groupResponse);
      } catch (error) {
        setError(error.message || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return {
    categories,
    groups,
    loading,
    error,
  };
}
