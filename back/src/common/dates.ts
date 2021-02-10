import { parse, isValid, isDate } from "date-fns";

export const allowedFormats = [
  "yyyy-MM-dd",
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd'T'HH:mm:ssX",
  "yyyy-MM-dd'T'HH:mm:ss.SSS",
  "yyyy-MM-dd'T'HH:mm:ss.SSSX"
];

export function isAllowedFormat(dateString: string) {
  if (isDate(dateString)) {
    return true;
  }
  for (const fmt of allowedFormats) {
    const date = parse(dateString, fmt, new Date());
    if (isValid(date)) {
      return true;
    }
  }
  return false;
}
