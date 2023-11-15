import { Bsdasri, BsdasriType } from "@prisma/client";
import * as QRCode from "qrcode";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { generatePdf } from "../../common/pdf";
import { expandBsdasriFromDB, expandGroupingDasri, expandSynthesizingDasri } from "../converter";
import prisma from "../../prisma";
import { BsdasriPdf } from "./components/BsdasriPdf";

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

export async function buildPdf(bsdasri: Bsdasri) {
  const qrCode = await QRCode.toString(bsdasri.id, { type: "svg" });
  const expandedBsdasri = expandBsdasriFromDB(bsdasri);

  const associatedBsdasris = await getAssociatedBsdasris(bsdasri);

  const html = ReactDOMServer.renderToStaticMarkup(
    <BsdasriPdf
      bsdasri={expandedBsdasri}
      qrCode={qrCode}
      associatedBsdasris={associatedBsdasris}
    />
  );
  return generatePdf(html);
}
