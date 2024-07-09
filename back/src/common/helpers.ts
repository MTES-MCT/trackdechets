/**
 * Formats a date like "8 juillet 2024 à 17:49"
 */
export const dateToXMonthAtHHMM = (date: Date = new Date()): string => {
  const options = {
    year: "numeric" as "numeric",
    month: "long" as "long",
    day: "numeric" as "numeric",
    hour: "2-digit" as "2-digit",
    minute: "2-digit" as "2-digit"
  };

  return date.toLocaleDateString("fr-FR", options);
};
