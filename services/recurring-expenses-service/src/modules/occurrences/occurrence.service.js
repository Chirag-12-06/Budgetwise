import prisma from "../../config/db.js";
import {
  calculateNextDate,
  normalizeDate,
} from "../../utils/recurrence.utils.js";

export const generateUpcomingOccurrences = async (
  tx,
  recurringExpense
) => {
  const {
    id,
    startDate,
    frequency,
    intervalValue,
    endType,
    endCount,
    endDate,
    nextDueDate,
  } = recurringExpense;

  const today = normalizeDate(new Date());

  // Generate occurrences for the next 3 months.
  const windowEnd = new Date(today);
  windowEnd.setUTCMonth(windowEnd.getUTCMonth() + 3);

  const anchorDate = normalizeDate(startDate);
  let currentDate = normalizeDate(nextDueDate ?? startDate);

  // Count every existing occurrence, regardless of status.
  const existingCount = await tx.recurringOccurrence.count({
    where: {
      recurringExpenseId: id,
    },
  });

  const occurrences = [];
  let totalCount = existingCount;

  while (currentDate <= windowEnd) {
    // COUNT includes all scheduled occurrence records.
    if (
      endType === "COUNT" &&
      totalCount >= endCount
    ) {
      break;
    }

    // Do not generate beyond the specified end date.
    if (
      endType === "UNTIL_DATE" &&
      currentDate > normalizeDate(endDate)
    ) {
      break;
    }

    occurrences.push({
      recurringExpenseId: id,
      scheduledDate: currentDate,
      status: "PENDING",
    });

    totalCount++;

    currentDate = calculateNextDate(
      currentDate,
      frequency,
      intervalValue,
      anchorDate
    );
  }

  if (occurrences.length > 0) {
    await tx.recurringOccurrence.createMany({
      data: occurrences,
      skipDuplicates: true,
    });
  }

  // Update the next date only after generation.
  await tx.recurringExpense.update({
    where: { id },
    data: {
      nextDueDate: currentDate,
    },
  });

  return occurrences;
};

// Create occurrence
export const createOccurrenceService = async (data) => {
  return prisma.recurringOccurrence.create({
    data,
  });
};

// Fetch all occurrences for a recurring expense
export const fetchOccurrencesService = async (recurringExpenseId) => {
  return prisma.recurringOccurrence.findMany({
    where: {
      recurringExpenseId,
    },
    orderBy: {
      scheduledDate: "asc",
    },
  });
};

// Fetch occurrences for a user
export const fetchUserOccurrencesService = async (userId) => {
  return prisma.recurringOccurrence.findMany({
    where: {
      recurringExpense: {
        userId,
      },
    },
    orderBy: {
      scheduledDate: "asc",
    },
  });
};

// Fetch occurrence by ID
export const fetchOccurrenceByIdService = async (id, userId) => {
  return prisma.recurringOccurrence.findFirst({
    where: {
      id,
      recurringExpense: {
        userId,
      },
    },
  });
};

// Update occurrence status
export const updateOccurrenceStatusService = async (id, userId, status) => {
  return prisma.recurringOccurrence.updateMany({
    where: {
      id,
      recurringExpense: {
        userId,
      },
    },
    data: {
      status,
    },
  });
};

// Delete occurrence
export const deleteOccurrenceService = async (id, userId) => {
  return prisma.recurringOccurrence.deleteMany({
    where: {
      id,
      recurringExpense: {
        userId,
      },
    },
  });
};
