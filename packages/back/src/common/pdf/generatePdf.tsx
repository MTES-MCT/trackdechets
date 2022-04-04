import path from "path";
import fs from "fs/promises";
import { format } from "date-fns";
import { toPDF } from "./pdf";
import { CSS_PATHS } from "./components";

export function formatDate(date?: Date) {
  return date ? format(date, "dd/MM/yyyy") : "__/__/____";
}

export async function generatePdf(html: string) {
  const files = { "index.html": html };

  for (const cssPath of CSS_PATHS) {
    const content = await fs.readFile(cssPath, "utf-8");
    files[path.basename(cssPath)] = content;
  }

  return toPDF(files);
}
