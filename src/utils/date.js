export function formatDateDMY(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const datePart = value.split("T")[0];
    const parts = datePart.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const [year, month, day] = parts;
      return `${day}-${month}-${year}`;
    }
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  const day = String(parsedDate.getDate()).padStart(2, "0");
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const year = parsedDate.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatTrendLabel(label, groupBy) {
  if (groupBy === "daily") {
    return formatDateDMY(label);
  }

  if (groupBy === "monthly" && typeof label === "string") {
    const parts = label.split("-");
    if (parts.length === 2 && parts[0].length === 4) {
      const [year, month] = parts;
      return `${month}-${year}`;
    }
  }

  return label;
}
