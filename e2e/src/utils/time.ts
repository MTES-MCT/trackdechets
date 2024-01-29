/**
 * To get format YYYY-MM-DD
 */
export const toYYYYMMDD = (date: Date) => {
  return date.toISOString().split("T")[0];
};

/**
 * To get format DD/MM/YYYY
 */
export const toDDMMYYYY = (date: Date) => {
  return date.toLocaleDateString("fr-FR");
};
