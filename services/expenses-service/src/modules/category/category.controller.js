import { fetchCategories } from "./category.service.js";
import asyncHandler from "../../../../utils/asyncHandler.js";

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await fetchCategories();

  res.status(200).json({
    success: true,
    data: categories,
  });
});
