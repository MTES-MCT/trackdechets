import { Bsff, BsffFicheIntervention, BsffPackaging } from "@prisma/client";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import * as QRCode from "qrcode";

import { generatePdf } from "../../common/pdf";
import { BsffPdf } from "./BsffPdf";
import {
  expandBsffFromDB,
  expandBsffPackagingFromDB,
  expandFicheInterventionBsffFromDB
} from "../converter";
import { emptyValues } from "../../common/pdf/utils";

export async function buildPdf(
  bsff: Bsff & { packagings: BsffPackaging[] } & {
    ficheInterventions: BsffFicheIntervention[];
  } & { previousBsffs: (Bsff & { packagings: BsffPackaging[] })[] }
) {
  const qrCode = await QRCode.toString(bsff.id, { type: "svg" });
  const html = ReactDOMServer.renderToStaticMarkup(
    <BsffPdf
      bsff={emptyValues({
        ...expandBsffFromDB(bsff),
        packagings: bsff.packagings.map(expandBsffPackagingFromDB),
        ficheInterventions: bsff.ficheInterventions.map(
          expandFicheInterventionBsffFromDB
        ),
        previousBsffs: bsff.previousBsffs.map(previous => ({
          ...expandBsffFromDB(previous),
          packagings: previous.packagings.map(expandBsffPackagingFromDB)
        }))
      })}
      qrCode={qrCode}
    />
  );
  return generatePdf(html);
}
