import path from "path";
import fs from "fs/promises";
import mustache from "mustache";
import { format } from "date-fns";
import { Bsff } from "@prisma/client";
import prisma from "../../prisma";
import { BsffPackaging } from "../../generated/graphql/types";
import { toPDF } from "../../common/pdf";
import { BSFF_TYPE, OPERATION } from "../constants";

const assetsPath = path.join(__dirname, "assets");
const templatePath = path.join(assetsPath, "index.html");
const cssPaths = [
  path.join(assetsPath, "modern-normalize.css"),
  path.join(assetsPath, "styles.css")
];

export async function generateBsffPdf(bsff: Bsff) {
  const previousBsffs = await prisma.bsff.findMany({
    where: {
      nextBsffId: bsff.id
    }
  });
  const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
    where: {
      bsffId: bsff.id
    }
  });

  const bsffType = {
    isTracerFluide: bsff.type === BSFF_TYPE.TRACER_FLUIDE,
    isCollectePetitesQuantites:
      bsff.type === BSFF_TYPE.COLLECTE_PETITES_QUANTITES,
    isGroupement: bsff.type === BSFF_TYPE.GROUPEMENT,
    isReconditionnement: bsff.type === BSFF_TYPE.RECONDITIONNEMENT,
    isReexpedition: bsff.type === BSFF_TYPE.REEXPEDITION
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
    isReexpedition: bsffType.isReexpedition
  };
  const html = mustache.render(await fs.readFile(templatePath, "utf-8"), {
    bsff,
    bsffType,
    bsffOperation,
    packagings: ((bsff.packagings ?? []) as BsffPackaging[])
      .map(
        packaging =>
          `${[packaging.name, packaging.volume, `n°${packaging.numero}`]
            .filter(Boolean)
            .join(" ")} : ${packaging.kilos} kilo(s)`
      )
      .join(", "),
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
