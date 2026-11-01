import express from "express";

import {
  createOccurrenceController,
  getAllOccurrenceController,
  getByRecurringExpenseOccurrenceController,
  getByIdOccurrenceController,
  updateStatusOccurrenceController,
  removeOccurrenceController,
} from "./occurrence.controller.js";

const router = express.Router();

router.post("/", createOccurrenceController);

router.get("/", getAllOccurrenceController);
router.get("/recurring/:recurringExpenseId", getByRecurringExpenseOccurrenceController);
router.get("/:id", getByIdOccurrenceController);

router.patch("/:id/status", updateStatusOccurrenceController);

router.delete("/:id", removeOccurrenceController);

export { router };