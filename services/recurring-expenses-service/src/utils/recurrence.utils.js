const addDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const getDateInMonth = (year, month, originalDay) => {
  const lastDay = new Date(
    Date.UTC(year, month + 1, 0)
  ).getUTCDate();

  return new Date(
    Date.UTC(year, month, Math.min(originalDay, lastDay))
  );
};

export const calculateNextDate = (
  date,
  frequency,
  intervalValue = 1,
  anchorDate = date
) => {
  switch (frequency) {
    case "DAILY":
      return addDays(date, intervalValue);

    case "WEEKLY":
      return addDays(date, intervalValue * 7);

    case "MONTHLY": {
      const targetMonth =
        date.getUTCMonth() + intervalValue;

      const targetYear =
        date.getUTCFullYear() + Math.floor(targetMonth / 12);

      const month = targetMonth % 12;

      return getDateInMonth(
        targetYear,
        month,
        anchorDate.getUTCDate()
      );
    }

    case "YEARLY": {
      const targetYear =
        date.getUTCFullYear() + intervalValue;

      return getDateInMonth(
        targetYear,
        anchorDate.getUTCMonth(),
        anchorDate.getUTCDate()
      );
    }

    default:
      throw new Error("Invalid recurrence frequency");
  }
};

export const normalizeDate = (date) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );