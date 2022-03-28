import { Bsda } from "@prisma/client";
import * as QRCode from "qrcode";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { generatePdf } from "../../common/pdf";
import { expandBsdaFromDb } from "../converter";
import { getBsdaHistory } from "../database";
import { BsdaPdf } from "./components/BsdaPdf";

export async function buildPdf(bsda: Bsda) {
  const qrCode = await QRCode.toString(bsda.id, { type: "svg" });
  const expandedBsda = expandBsdaFromDb(bsda);

  const previousDbBsdas = await getBsdaHistory(bsda);
  const previousBsdas = previousDbBsdas.map(bsda => expandBsdaFromDb(bsda));

  const html = ReactDOMServer.renderToStaticMarkup(
    <BsdaPdf
      bsda={expandedBsda}
      qrCode={qrCode}
      previousBsdas={previousBsdas}
    />
  );
  return generatePdf(html);
}
