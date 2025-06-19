import { Bsdasri, BsdasriType } from "@prisma/client";
import * as QRCode from "qrcode";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { generatePdf } from "../../common/pdf";
import {
  expandBsdasriFromDB,
  expandGroupingDasri,
  expandSynthesizingDasri
} from "../converter";
import { prisma } from "@td/prisma";
import { BsdasriPdf } from "./components/BsdasriPdf";
import { emptyValues } from "../../common/pdf/emptypdf";

import { BsdasriWithIntermediaries } from "../types";

const getAssociatedBsdasris = async (bsdasri: Bsdasri) => {
  if (bsdasri.type === BsdasriType.SYNTHESIS) {
    const associated = await prisma.bsdasri.findMany({
      where: {
        synthesizedInId: bsdasri.id
      }
    });
    return associated.map(bsd => expandSynthesizingDasri(bsd));
  }
  if (bsdasri.type === BsdasriType.GROUPING) {
    const associated = await prisma.bsdasri.findMany({
      where: {
        groupedInId: bsdasri.id
      }
    });
    return associated.map(bsd => expandGroupingDasri(bsd));
  }
  return null;
};

export async function buildPdf(
  bsdasri: BsdasriWithIntermediaries,
  renderEmptyPdf?: boolean
) {
  const qrCode = renderEmptyPdf
    ? ""
    : await QRCode.toString(bsdasri.id, { type: "svg" });
  let expandedBsdasri = {
    ...expandBsdasriFromDB(bsdasri),
    intermediaries: bsdasri.intermediaries
  };

  let associatedBsdasris = await getAssociatedBsdasris(bsdasri);
  if (renderEmptyPdf) {
    expandedBsdasri = emptyValues(expandedBsdasri);
    associatedBsdasris = emptyValues(associatedBsdasris);
    associatedBsdasris = emptyValues(associatedBsdasris);
  }
  const html = ReactDOMServer.renderToStaticMarkup(
    <BsdasriPdf
      bsdasri={expandedBsdasri}
      qrCode={qrCode}
      associatedBsdasris={associatedBsdasris}
    />
  );
  return generatePdf(html);
}
