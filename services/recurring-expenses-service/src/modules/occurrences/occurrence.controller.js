import {
  createOccurrenceService,
  fetchOccurrencesService,
  fetchUserOccurrencesService,
  fetchOccurrenceByIdService,
  updateOccurrenceStatusService,
  deleteOccurrenceService,
} from "./occurrence.service.js";

import asyncHandler from "../../../../utils/asyncHandler.js";

// Create occurrence
export const createOccurrenceController = asyncHandler(async (req, res) => {
  const occurrence = await createOccurrenceService(req.body);

  res.status(201).json({
    success: true,
    data: occurrence,
  });
});

// Fetch occurrences for a recurring expense
export const getByRecurringExpenseOccurrenceController = asyncHandler(async (req, res) => {
  const occurrences = await fetchOccurrencesService(req.params.recurringExpenseId);

  res.status(200).json({
    success: true,
    data: occurrences,
  });
});

// Fetch all occurrences for authenticated user
export const getAllOccurrenceController = asyncHandler(async (req, res) => {
  const occurrences = await fetchUserOccurrencesService(req.user.id);

  res.status(200).json({
    success: true,
    data: occurrences,
  });
});

// Fetch occurrence by ID
export const getByIdOccurrenceController = asyncHandler(async (req, res) => {
  const occurrence = await fetchOccurrenceByIdService(
    req.params.id,
    req.user.id
  );

  if (!occurrence) {
    return res.status(404).json({
      success: false,
      message: "Occurrence not found",
    });
  }

  res.status(200).json({
    success: true,
    data: occurrence,
  });
});

// Update occurrence status
export const updateStatusOccurrenceController = asyncHandler(async (req, res) => {
  const result = await updateOccurrenceStatusService(
    req.params.id,
    req.user.id,
    req.body.status
  );

  if (result.count === 0) {
    return res.status(404).json({
      success: false,
      message: "Occurrence not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Occurrence status updated successfully",
  });
});

// Delete occurrence
export const removeOccurrenceController = asyncHandler(async (req, res) => {
  const result = await deleteOccurrenceService(
    req.params.id,
    req.user.id
  );

  if (result.count === 0) {
    return res.status(404).json({
      success: false,
      message: "Occurrence not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Occurrence deleted successfully",
  });
});