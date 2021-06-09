import path from "path";
import fs from "fs/promises";
import mustache from "mustache";
import { Bsff } from ".prisma/client";
import { generatePdf } from "../../common/pdf";

const templatePath = require.resolve(
  path.join(__dirname, "assets", "pdf.html")
);

export async function generateBsffPdf(bsff: Bsff) {
  return generatePdf(
    mustache.render(await fs.readFile(templatePath, "utf-8"), { bsff })
  );
}
