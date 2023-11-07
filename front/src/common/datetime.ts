// eslint-disable-next-line import/no-duplicates
import { parseISO, format, toDate, isValid } from "date-fns";
// eslint-disable-next-line import/no-duplicates
import fr from "date-fns/locale/fr";

export function parseDate(date: Date | number | string): Date {
  if (typeof date === "string") {
    return parseISO(date);
  }

  return toDate(date);
}

export function formatDate(date: Date | number | string): string {
  const parsedDate = parseDate(date);
  if (!isValid(parsedDate)) return "";

  return format(parsedDate, "dd/MM/y", {
    locale: fr
  });
}
