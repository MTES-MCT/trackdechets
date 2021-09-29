import path from "path";
import fs from "fs/promises";
import mustache from "mustache";
import { format } from "date-fns";
import { Bsff, BsffType, WasteAcceptationStatus } from "@prisma/client";
import * as QRCode from "qrcode";
import prisma from "../../prisma";
import { BsffPackaging } from "../../generated/graphql/types";
import { toPDF } from "../../common/pdf";
import { OPERATION } from "../constants";
import { getBsffHistory } from "../database";

const assetsPath = path.join(__dirname, "assets");
const templatePath = path.join(assetsPath, "index.html");
const signaturePath = path.join(assetsPath, "signature.svg");
const cssPaths = [
  path.join(assetsPath, "modern-normalize.css"),
  path.join(assetsPath, "styles.css")
];

export async function generateBsffPdf(bsff: Bsff) {
  const previousBsffs = await getBsffHistory(bsff);
  const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
    where: {
      bsffId: bsff.id
    }
  });

  const bsffType = {
    isTracerFluide: bsff.type === BsffType.TRACER_FLUIDE,
    isCollectePetitesQuantites:
      bsff.type === BsffType.COLLECTE_PETITES_QUANTITES,
    isGroupement: bsff.type === BsffType.GROUPEMENT,
    isReconditionnement: bsff.type === BsffType.RECONDITIONNEMENT,
    isReexpedition: bsff.type === BsffType.REEXPEDITION
  };
  const bsffOperation = {
    isRecuperationR2: bsff.destinationOperationCode === OPERATION.R2.code,
    isIncinerationD10: bsff.destinationOperationCode === OPERATION.D10.code,
    isGroupementR12:
      bsff.destinationOperationCode === OPERATION.R12.code &&
      bsffType.isGroupement,
    isGroupementD13: bsff.destinationOperationCode === OPERATION.D13.code,
    isReconditionnementR12:
      bsff.destinationOperationCode === OPERATION.R12.code &&
      bsffType.isReconditionnement,
    isReconditionnementD14:
      bsff.destinationOperationCode === OPERATION.D14.code,
    isReexpeditionR13:
      bsffType.isReexpedition &&
      bsff.destinationOperationCode === OPERATION.R13.code,
    isReexpeditionD15:
      bsffType.isReexpedition &&
      bsff.destinationOperationCode === OPERATION.D15.code
  };

  const qrCode = await QRCode.toString(bsff.id, { type: "svg" });

  const signature = await fs.readFile(signaturePath, "utf-8");
  const signatures = {
    emission: bsff.emitterEmissionSignatureDate ? signature : "",
    transport: bsff.transporterTransportSignatureDate ? signature : "",
    reception: bsff.destinationReceptionDate ? signature : "",
    operation: bsff.destinationOperationSignatureDate ? signature : ""
  };

  const html = mustache.render(await fs.readFile(templatePath, "utf-8"), {
    qrCode,
    bsff,
    bsffType,
    bsffOperation,
    packagings: ((bsff.packagings ?? []) as BsffPackaging[])
      .map(
        packaging =>
          `${[
            packaging.name,
            packaging.volume ? `${packaging.volume}L` : null,
            `n°${packaging.numero}`
          ]
            .filter(Boolean)
            .join(" ")} : ${packaging.weight} kilo(s)`
      )
      .join(", "),
    receptionAccepted:
      !!bsff.destinationReceptionDate &&
      bsff.destinationReceptionAcceptationStatus ===
        WasteAcceptationStatus.ACCEPTED,
    recepetionRefused:
      !!bsff.destinationReceptionDate &&
      bsff.destinationReceptionAcceptationStatus ===
        WasteAcceptationStatus.REFUSED,
    ficheInterventions: [
      ...ficheInterventions,

      // Show a minimum of 5 rows
      ...Array.from({ length: 5 - ficheInterventions.length }).fill({})
    ],
    previousBsffs: [
      ...previousBsffs,

      // Show a minimum of 5 rows
      ...Array.from({ length: 5 - ficheInterventions.length }).fill({})
    ],
    signatures,

    formatDate: () => (str: string, render: typeof mustache.render) => {
      const dateStr = render(str, {});
      return dateStr ? format(new Date(dateStr), "dd/MM/yyyy") : "__/__/____";
    }
  });
  const files = { "index.html": html };

  for (const cssPath of cssPaths) {
    const content = await fs.readFile(cssPath, "utf-8");
    files[path.basename(cssPath)] = content;
  }

  return toPDF(files);
}
