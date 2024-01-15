import * as QRCode from "qrcode";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { generatePdf } from "../../common/pdf";
import { expandBspaohFromDb } from "../converter";
import { PrismaBspaohWithTransporters } from "../types";
import { BspaohPdf } from "./components/BspaohPdf";
import concatStream from "concat-stream";

export async function buildPdf(bspaoh: PrismaBspaohWithTransporters) {
  const qrCode = await QRCode.toString(bspaoh.id, { type: "svg" });
  const expandedBspaoh = expandBspaohFromDb(bspaoh);

  const html = ReactDOMServer.renderToStaticMarkup(
    <BspaohPdf bspaoh={expandedBspaoh} qrCode={qrCode} />
  );
  return generatePdf(html);
}

export async function buildPdfAsBase64(
  bspaoh: PrismaBspaohWithTransporters
): Promise<string> {
  const readableStream = await buildPdf(bspaoh);

  return new Promise((resolve, reject) => {
    const convertToBase64 = concatStream(buffer =>
      resolve(buffer.toString("base64"))
    );

    readableStream.on("error", reject);
    readableStream.pipe(convertToBase64);
  });
}
