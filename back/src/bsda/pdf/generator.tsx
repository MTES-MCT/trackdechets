import { Prisma } from "@prisma/client";
import * as QRCode from "qrcode";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { generatePdf } from "../../common/pdf";
import { expandBsdaFromDb } from "../converter";
import { getBsdaHistory } from "../database";
import { BsdaPdf } from "./components/BsdaPdf";
import concatStream from "concat-stream";
import {
  BsdaWithIntermediariesInclude,
  BsdaWithTransportersInclude
} from "../types";
import { emptyValues } from "../../common/pdf/emptypdf";

export const BsdaForPDFInclude = {
  ...BsdaWithTransportersInclude,
  ...BsdaWithIntermediariesInclude
};

export type BsdaForPDF = Prisma.BsdaGetPayload<{
  include: typeof BsdaForPDFInclude;
}>;

export async function buildPdf(bsda: BsdaForPDF, renderEmptyPdf?: boolean) {
  const qrCode = renderEmptyPdf
    ? ""
    : await QRCode.toString(bsda.id, { type: "svg" });

  let expandedBsda = {
    ...expandBsdaFromDb(bsda),
    intermediaries: bsda.intermediaries
  };

  const previousDbBsdas = await getBsdaHistory(bsda, {
    include: BsdaForPDFInclude
  });
  let previousBsdas = previousDbBsdas.map(bsda => expandBsdaFromDb(bsda));
  if (renderEmptyPdf) {
    expandedBsda = emptyValues(expandedBsda);
    previousBsdas = emptyValues(previousBsdas);
  }
  const html = ReactDOMServer.renderToStaticMarkup(
    <BsdaPdf
      bsda={expandedBsda}
      qrCode={qrCode}
      previousBsdas={previousBsdas}
      renderEmpty={renderEmptyPdf}
    />
  );
  return generatePdf(html);
}

export async function buildPdfAsBase64(bsda: BsdaForPDF): Promise<string> {
  const readableStream = await buildPdf(bsda, false);

  return new Promise((resolve, reject) => {
    const convertToBase64 = concatStream(buffer =>
      resolve(buffer.toString("base64"))
    );

    readableStream.on("error", reject);
    readableStream.pipe(convertToBase64);
  });
}
