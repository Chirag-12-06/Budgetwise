export const isSameOrBefore = (date1, date2) => {
  return date1.getTime() <= date2.getTime();
};

export const normalizeDate = (date) => {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
};