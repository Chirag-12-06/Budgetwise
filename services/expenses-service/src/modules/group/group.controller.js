import { fetchCategoryGroups } from "./group.service.js";
import asyncHandler from "../../../../utils/asyncHandler.js";

export const getCategoryGroups = asyncHandler(async (req, res) => {
  const groups = await fetchCategoryGroups();

  res.status(200).json({
    success: true,
    data: groups,
  });
});
