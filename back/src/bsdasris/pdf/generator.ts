import { Bsdasri } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import * as QRCode from "qrcode";
import { format } from "date-fns";
import Handlebars from "handlebars";
import { toPDF } from "../../common/pdf";
import { transportModeLabels } from "../../common/pdf/helpers";

export async function buildPdf(bsdasri: Bsdasri) {
  const dasristamp = await fs.readFile(
    path.join(__dirname, "/templates/dasristamp.html"),
    "utf-8"
  );
  const template = await fs.readFile(
    path.join(__dirname, "/templates/dasri.html"),
    "utf-8"
  );

  Handlebars.registerHelper("dateFmt", safeDateFmt);
  Handlebars.registerHelper("sumPackageQuantity", sumPackageQuantity);
  Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
    // check strict equality for booleans, coerce for other types
    const isEqual = typeof arg2 === "boolean" ? arg1 === arg2 : arg1 == arg2;
    return isEqual ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("verboseTransportMode", function (transportMode) {
    if (!transportMode) {
      return "";
    }
    return transportModeLabels[transportMode];
  });

  const qrcode = !bsdasri.isDraft
    ? await QRCode.toString(bsdasri.id, { type: "svg" })
    : "";

  const source = template.toString();
  const compiled = Handlebars.compile(source);
  const html = compiled({ bsdasri, qrcode, dasristamp });

  return toPDF({
    "index.html": html,
    "paper.css": await getStyleFile("paper.css"),
    "dasri.css": await getStyleFile("dasri.css")
  });
}

const safeDateFmt = (dt: Date) => {
  if (!dt) {
    return "";
  }
  return format(dt, "dd/MM/yyyy");
};

const sumPackageQuantity = packagings => {
  if (!packagings) {
    return "";
  }
  return packagings
    .map(info => info.quantity)
    .reduce((acc, val) => acc + val, 0);
};

function getStyleFile(filename: string) {
  return fs.readFile(path.join(__dirname, "styles", filename), "utf-8");
}
