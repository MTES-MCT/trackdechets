import * as QRCode from "qrcode";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { generatePdf } from "../../common/pdf";
import { expandVhuFormFromDbWithIntermediaries } from "../converter";
import { BsvhuPdf } from "./components/BsvhuPdf";
import { emptyValues } from "../../common/pdf/emptypdf";
import { BsvhuWithTransportersAndIntermediaries } from "../types";

export async function buildPdf(
  bsvhu: BsvhuWithTransportersAndIntermediaries,
  renderEmpty?: boolean
) {
  const qrCode = renderEmpty
    ? ""
    : await QRCode.toString(bsvhu.id, { type: "svg" });
  let expandedBsvhu = expandVhuFormFromDbWithIntermediaries(bsvhu);
  if (renderEmpty) {
    expandedBsvhu = emptyValues(expandedBsvhu);
  }
  const html = ReactDOMServer.renderToStaticMarkup(
    <BsvhuPdf bsvhu={expandedBsvhu} qrCode={qrCode} renderEmpty={renderEmpty} />
  );
  return generatePdf(html);
}
