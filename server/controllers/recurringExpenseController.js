import { PrismaClient } from "@prisma/client";
import { logError } from "../utils/logger.js";

const prisma = new PrismaClient();

const VALID_FREQUENCIES = new Set(["daily", "weekly", "monthly", "yearly"]);
const VALID_END_TYPES = new Set(["forever", "count", "until_date"]);

function parseFlexibleDate(value) {
  if (!value) {
    return null;
  }

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const parts = String(value).split(/[-/\.]/).map((part) => part.trim());
  if (parts.length !== 3) {
    return null;
  }

  const [first, second, third] = parts;
  if (Number(first) > 0 && Number(first) <= 31) {
    const iso = `${third.padStart(4, "0")}-${second.padStart(2, "0")}-${first.padStart(2, "0")}`;
    const parsedIso = new Date(iso);
    if (!Number.isNaN(parsedIso.getTime())) {
      return parsedIso;
    }
  }

  return null;
}

function parsePositiveInteger(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return Math.trunc(parsed);
}

export const addRecurringExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      amount,
      category,
      frequency,
      intervalValue,
      startDate,
      endType,
      endCount,
      endDate,
    } = req.body;

    const normalizedTitle = String(title || "").trim();
    const normalizedCategory = String(category || "").trim();
    const normalizedFrequency = String(frequency || "").trim().toLowerCase();
    const normalizedEndType = String(endType || "").trim().toLowerCase();

    if (!normalizedTitle || amount === undefined || amount === null || !normalizedCategory) {
      return res.status(400).json({ message: "Title, amount, and category are required" });
    }

    if (!VALID_FREQUENCIES.has(normalizedFrequency)) {
      return res.status(400).json({ message: "Invalid recurrence frequency" });
    }

    if (!VALID_END_TYPES.has(normalizedEndType)) {
      return res.status(400).json({ message: "Invalid recurrence end type" });
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount)) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const parsedIntervalValue = parsePositiveInteger(intervalValue ?? 1);
    if (parsedIntervalValue === null) {
      return res.status(400).json({ message: "Interval must be a positive whole number" });
    }

    const parsedStartDate = parseFlexibleDate(startDate);
    if (!parsedStartDate) {
      return res.status(400).json({ message: "Invalid start date" });
    }

    let parsedEndCount = null;
    let parsedEndDate = null;

    if (normalizedEndType === "count") {
      parsedEndCount = parsePositiveInteger(endCount);
      if (parsedEndCount === null) {
        return res.status(400).json({ message: "Occurrences count must be a positive whole number" });
      }
    }

    if (normalizedEndType === "until_date") {
      parsedEndDate = parseFlexibleDate(endDate);
      if (!parsedEndDate) {
        return res.status(400).json({ message: "Repeat-until date is required" });
      }
    }

    const recurringExpense = await prisma.recurringExpense.create({
      data: {
        title: normalizedTitle,
        amount: parsedAmount,
        category: normalizedCategory,
        frequency: normalizedFrequency,
        intervalValue: parsedIntervalValue,
        startDate: parsedStartDate,
        endType: normalizedEndType,
        endCount: parsedEndCount,
        endDate: parsedEndDate,
        nextDueDate: parsedStartDate,
        userId,
      },
    });

    return res.status(201).json(recurringExpense);
  } catch (error) {
    logError("addRecurringExpense error:", error && error.stack ? error.stack : error);
    return res.status(500).json({ message: "Server error" });
  }
};