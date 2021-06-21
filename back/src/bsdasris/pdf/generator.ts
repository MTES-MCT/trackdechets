import { Bsdasri } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";
import { connect } from "puppeteer-core";
import QRCode from "qrcode";
import { format } from "date-fns";
import Handlebars from "handlebars";
import fs from "fs";

/**
 *
 * Build a pdf via service based puppeteer (browserless.io)
 */
export async function buildPdf(bsdasri: Bsdasri) {
  const browser = await connect({
    browserWSEndpoint: "wss://chrome.browserless.io"
  });
  const dasristamp = fs
    .readFileSync(join(__dirname, "/templates/dasristamp.html"), {
      encoding: "utf8"
    })
    .toString();
  const template = fs.readFileSync(join(__dirname, "/templates/dasri.html"), {
    encoding: "utf8"
  });

  Handlebars.registerHelper("dateFmt", safeDateFmt);
  Handlebars.registerHelper("sumPackageQuantity", sumPackageQuantity);
  Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  });

  const qrcode = !bsdasri.isDraft
    ? await QRCode.toString(bsdasri.id, { type: "svg" })
    : "";
  try {
    const source = template.toString();
    const compiled = Handlebars.compile(source);
    const html = compiled({ bsdasri, qrcode, dasristamp });

    const page = await browser.newPage();

    await page.setContent(html);

    const paperCss = await getStyleFile("paper.min.css");
    await page.addStyleTag({ content: paperCss });
    const dasriCss = await getStyleFile("dasri.css");
    await page.addStyleTag({ content: dasriCss });

    const pdfBuffer = await page.pdf({ format: "a4" });
    await browser.close();

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

const safeDateFmt = (dt: Date) => {
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
