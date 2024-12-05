// eslint-disable-next-line import/no-duplicates
import { parseISO, format, toDate, isValid } from "date-fns";
// eslint-disable-next-line import/no-duplicates
import fr from "date-fns/locale/fr";

type Props = Date | number | string;

export function parseDate(date: Props): Date {
  if (typeof date === "string") {
    return parseISO(date);
  }

  return toDate(date);
}

export function formatDate(date: Props): string {
  const parsedDate = parseDate(date);
  if (!isValid(parsedDate)) return "";

  return format(parsedDate, "dd/MM/y", {
    locale: fr
  });
}

export function formatDateTime(date: Props): string {
  const parsedDate = parseDate(date);
  if (!isValid(parsedDate)) return "";

  return format(parsedDate, "dd/MM/y à HH:mm", {
    locale: fr
  });
}

// YYYY-MM-DD
export const datetimeToYYYYMMDD = (dt: Date): string =>
  format(new Date(dt), "yyyy-MM-dd");
