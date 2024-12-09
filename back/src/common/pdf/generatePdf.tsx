import path from "path";
import fs from "fs/promises";
import { format } from "date-fns";
import { toPDF } from "./pdf";
import { CSS_PATHS } from "./components";
import type { Maybe } from "@td/codegen-back";

export function formatDate(date?: Date | null) {
  return date ? format(date, "dd/MM/yyyy") : "__/__/____";
}

export function formatDateTime(date?: Date | null) {
  return date ? format(date, "dd/MM/yyyy HH:mm") : "__/__/____  __:__";
}

/**
 *
 * Build full address from different fields
 * Avoid repetition if city or postalCode are already include in address field
 */
export function buildPdfAddress(
  addressComponents: (Maybe<string> | undefined)[]
): string {
  // Filter nulls and undefineds
  const nonNullAdressComponents = addressComponents.filter((c): c is string =>
    Boolean(c)
  );

  if (!nonNullAdressComponents?.length) return "";

  // Remove duplicate infos (if user put all address in 1st field)
  const noDuplicatesAddressComponents = nonNullAdressComponents.filter(
    (bit: string) => !!bit && !nonNullAdressComponents[0].includes(bit)
  );

  // Concatenate first field + other info
  return [nonNullAdressComponents[0], ...noDuplicatesAddressComponents]
    .join(" ")
    .trim();
}

export async function generatePdf(html: string) {
  const files = { "index.html": html };

  for (const cssPath of CSS_PATHS) {
    const content = await fs.readFile(cssPath, "utf-8");
    files[path.basename(cssPath)] = content;
  }

  return toPDF(files);
}
