export function isoDateToHtmlDate(date: unknown) {
  if (typeof date !== "string") {
    return undefined;
  }

  return date.split("T")[0];
}
