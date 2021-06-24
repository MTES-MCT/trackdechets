import path from "path";
import fs from "fs/promises";
import { Response } from "express";
import { connect, launch } from "puppeteer";

const cssPaths = [
  require.resolve("modern-normalize/modern-normalize.css"),
  require.resolve(path.join(__dirname, "assets", "pdf.css"))
];

export async function generatePdf(content: string): Promise<Buffer> {
  const browser =
    process.env.NODE_ENV === "production"
      ? await connect({
          browserWSEndpoint: "wss://chrome.browserless.io/"
        })
      : await launch();

  try {
    const page = await browser.newPage();

    await page.setContent(content);

    await Promise.all(
      cssPaths.map(async cssPath =>
        page.addStyleTag({ content: await fs.readFile(cssPath, "utf-8") })
      )
    );

    const buffer = await page.pdf({ format: "a4" });

    return buffer;
  } finally {
    await browser.close();
  }
}

export function sendPdf(res: Response, buffer: Buffer, filename: string) {
  res.type("pdf");

  if (process.env.NODE_ENV === "production") {
    res.attachment(`${filename}.pdf`);
  }

  res.send(buffer);
}
