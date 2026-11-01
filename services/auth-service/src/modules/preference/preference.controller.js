import {
  fetchPreferences,
  updatePreferences,
} from "./preference.service.js";

import asyncHandler from "../../../../utils/asyncHandler.js";

const allowedFields = [
  "reportingCurrency",
  "timeZone",
  "dateFormat",
  "language",
];

export const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await fetchPreferences(req.user.id);

  res.status(200).json({
    success: true,
    data: preferences,
  });
});

export const updateUserPreferences = asyncHandler(async (req, res) => {
  const data = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      data[field] = req.body[field];
    }
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid preference fields provided",
    });
  }

  const preferences = await updatePreferences(req.user.id, data);

  res.status(200).json({
    success: true,
    message: "Preferences updated successfully",
    data: preferences,
  });
});