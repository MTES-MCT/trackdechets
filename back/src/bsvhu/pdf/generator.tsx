import { Bsvhu } from "@prisma/client";
import * as QRCode from "qrcode";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { generatePdf } from "../../common/pdf";
import { expandVhuFormFromDb } from "../converter";
import { BsvhuPdf } from "./components/BsvhuPdf";
import { emptyValues } from "../../common/pdf/utils";

export async function buildPdf(bsvhu: Bsvhu) {
  const qrCode = await QRCode.toString(bsvhu.id, { type: "svg" });
  const expandedBsvhu = expandVhuFormFromDb(bsvhu);

  const html = ReactDOMServer.renderToStaticMarkup(
    <BsvhuPdf bsvhu={emptyValues(expandedBsvhu)} qrCode={qrCode} />
  );
  return generatePdf(html);
}
