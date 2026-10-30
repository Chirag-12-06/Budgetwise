function parseDateOnly(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  return { year, month, day };
}

function toLocalDateKey(value) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }
  return formatDateKey(parsedDate);
}

export function formatDateKey(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const datePart = value.split("T")[0];
    const parsedDateOnly = parseDateOnly(datePart);
    if (parsedDateOnly) {
      const month = String(parsedDateOnly.month).padStart(2, "0");
      const day = String(parsedDateOnly.day).padStart(2, "0");
      return `${parsedDateOnly.year}-${month}-${day}`;
    }
  }

  const dateOnly = parseDateOnly(value);
  if (dateOnly) {
    const month = String(dateOnly.month).padStart(2, "0");
    const day = String(dateOnly.day).padStart(2, "0");
    return `${dateOnly.year}-${month}-${day}`;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateDMY(value) {
  if (!value) {
    return "";
  }

  const dateKey = formatDateKey(value);
  const parts = dateKey.split("-");
  if (parts.length !== 3) {
    return String(value);
  }

  const [year, month, day] = parts;
  return `${day}-${month}-${year}`;
}

export function formatTrendLabel(label, groupBy) {
  if (groupBy === "daily" && typeof label === "string") {
    return new Date(label).toLocaleDateString("default", {
      day: "2-digit",
      month: "short",
    });
  }
  if (groupBy === "monthly" && typeof label === "string") {
    const parts = label.split("-");

    if (parts.length === 2 && parts[0].length === 4) {
      const [year, month] = parts;

      return new Date(Number(year), Number(month) - 1, 1).toLocaleString(
        "default",
        {
          month: "short",
        },
      );
    }
  }

  if (groupBy === "weekly" && typeof label === "string") {
    const start = new Date(label);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startLabel = start.toLocaleDateString("default", {
      day: "2-digit",
      month: "short",
    });

    const endLabel = end.toLocaleDateString("default", {
      day: "2-digit",
      month: "short",
    });

    return `${startLabel} - ${endLabel}`;
  }

  return label;
}

export function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getNextDateKey(dateKey) {
  const [year, month, day] = String(dateKey || "")
    .split("-")
    .map((value) => Number(value));
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return "";
  }

  const nextDate = new Date(year, month - 1, day + 1);
  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
  const nextDay = String(nextDate.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function extractExpenseDateKey(expense) {
  const source = expense?.createdAt ?? expense?.date;
  if (!source) {
    return null;
  }

  if (typeof source === "string") {
    const sourceDatePart = source.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(sourceDatePart)) {
      return sourceDatePart;
    }

    return toLocalDateKey(source);
  }

  return toLocalDateKey(source);
}