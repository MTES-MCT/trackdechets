import { Bsdasri } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";
import { connect } from "puppeteer-core";
import ejs from "ejs";
import QRCode from "qrcode";
import { format } from "date-fns";

/**
 * 
 * Build a pdf via service based puppeteer (browserless.io)
 */
export async function buildPdf(bsdasri: Bsdasri) {
  const browser = await connect({
    browserWSEndpoint: "wss://chrome.browserless.io/"
  });

  try {
    const tplPath = join(__dirname, "/templates/dasri.ejs");
    const qrcode = !bsdasri.isDraft
      ? await QRCode.toString(bsdasri.id, { type: "svg" })
      : "";
    const html = await ejs.renderFile(
      tplPath,
      { bsdasri, qrcode, sumPackageQuantity, dateFmt: safeDateFmt },
      { error: false }
    );

    const page = await browser.newPage();

    await page.setContent(html);

    const paperCss = await getStyleFile("paper.min.css");
    await page.addStyleTag({ content: paperCss });
    const dasriCss = await getStyleFile("dasri.css");
    await page.addStyleTag({ content: dasriCss });

    const pdfBuffer = await page.pdf({ format: "a4" });
    await browser.close();

    return pdfBuffer;
  } catch (err) {
    await browser.close();
    throw new Error("Erreur lors du téléchargement du PDF");
  }
}

const safeDateFmt = dt => {
  if (!dt) {
    return "";
  }
  return format(dt, "dd/MM/yyyy");
};

const sumPackageQuantity = packagingInfos => {
  if (!packagingInfos) {
    return "";
  }
  return packagingInfos
    .map(info => info.quantity)
    .reduce((acc, val) => acc + val, 0);
};

async function getStyleFile(filename: string) {
  const buffer = await readFile(join(__dirname, "styles", filename));
  return buffer.toString();
}
