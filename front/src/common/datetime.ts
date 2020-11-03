import { DateTime } from "luxon";

export const isoDate = (givenDate: string | null | undefined): string => {
  if (!givenDate) {
    return "";
  }
  const parsed = DateTime.fromISO(givenDate);

  return parsed.isValid ? parsed.toLocaleString() : "";
};
