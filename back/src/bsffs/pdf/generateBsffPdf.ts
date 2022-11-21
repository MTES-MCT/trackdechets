import path from "path";
import fs from "fs/promises";
import mustache from "mustache";
import { format } from "date-fns";
import {
  Bsff,
  BsffPackaging,
  BsffType,
  TransportMode,
  WasteAcceptationStatus
} from "@prisma/client";
import * as QRCode from "qrcode";
import prisma from "../../prisma";
import { OPERATION } from "../constants";
import { generatePdf, TRANSPORT_MODE_LABELS } from "../../common/pdf";
import { getPreviousPackagings } from "../database";

const assetsPath = path.join(__dirname, "assets");
const templatePath = path.join(assetsPath, "index.html");
const signaturePath = path.join(assetsPath, "signature.svg");

export async function generateBsffPdf(
  bsff: Bsff & { packagings: BsffPackaging[] }
) {
  const previousPackagings = await getPreviousPackagings(
    bsff.packagings.map(p => p.id)
  );
  const previousBsffIds = [...new Set(previousPackagings.map(p => p.bsffId))];
  const bsffs = await prisma.bsff.findMany({
    where: { id: { in: previousBsffIds } }
  });
  const previousBsffs = previousBsffIds
    .map(id => bsffs.find(bsff => bsff.id === id))
    .filter(v => !!v)
    .map(bsff => ({ ...bsff, ficheInterventions: [], packagings: [] }));

  const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
    where: { bsffs: { some: { id: { in: [bsff.id] } } } }
  });
  const packagings = await prisma.bsff
    .findUnique({ where: { id: bsff.id } })
    .packagings();

  // TODO handle differenciate acceptation, analysis and treatment by packaging
  const packaging = bsff.packagings[0];

  const bsffType = {
    isTracerFluide: bsff.type === BsffType.TRACER_FLUIDE,
    isCollectePetitesQuantites:
      bsff.type === BsffType.COLLECTE_PETITES_QUANTITES,
    isGroupement: bsff.type === BsffType.GROUPEMENT,
    isReconditionnement: bsff.type === BsffType.RECONDITIONNEMENT,
    isReexpedition: bsff.type === BsffType.REEXPEDITION
  };
  const bsffOperation = {
    isRecuperationR2: packaging?.operationCode === OPERATION.R2.code,
    isRecyclageR3: packaging?.operationCode === OPERATION.R3.code,
    isIncinerationD10: packaging?.operationCode === OPERATION.D10.code,
    isGroupementR12:
      packaging?.operationCode === OPERATION.R12.code && bsffType.isGroupement,
    isGroupementD13: packaging?.operationCode === OPERATION.D13.code,
    isReconditionnementR12:
      packaging?.operationCode === OPERATION.R12.code &&
      bsffType.isReconditionnement,
    isReconditionnementD14: packaging?.operationCode === OPERATION.D14.code,
    isReexpeditionR13:
      bsffType.isReexpedition &&
      packaging?.operationCode === OPERATION.R13.code,
    isReexpeditionD15:
      bsffType.isReexpedition && packaging?.operationCode === OPERATION.D15.code
  };

  const qrCode = await QRCode.toString(bsff.id, { type: "svg" });

  const signature = await fs.readFile(signaturePath, "utf-8");
  const signatures = {
    emission: bsff.emitterEmissionSignatureDate ? signature : "",
    transport: bsff.transporterTransportSignatureDate ? signature : "",
    reception: bsff.destinationReceptionDate ? signature : "",
    operation: packaging?.operationSignatureDate ? signature : ""
  };

  const transportMode =
    TRANSPORT_MODE_LABELS[bsff.transporterTransportMode ?? TransportMode.ROAD];

  const html = mustache.render(await fs.readFile(templatePath, "utf-8"), {
    qrCode,
    bsff,
    bsffType,
    bsffOperation,
    transportMode,
    packagings: packagings
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
      packaging.acceptationStatus === WasteAcceptationStatus.ACCEPTED,
    recepetionRefused:
      !!bsff.destinationReceptionDate &&
      packaging.acceptationStatus === WasteAcceptationStatus.REFUSED,
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

  return generatePdf(html);
}
