import path from "path";
import fs from "fs/promises";
import mustache from "mustache";
import { format } from "date-fns";
import { Bsff } from ".prisma/client";
import prisma from "../../prisma";
import { BsffPackaging } from "../../generated/graphql/types";
import { generatePdf } from "../../common/pdf";
import { GROUPING_CODES, OPERATION_CODES } from "../constants";

const templatePath = require.resolve(
  path.join(__dirname, "assets", "pdf.html")
);

/*
 * A groupement is when several bsffs are grouped but the packagings are unchanged.
 */
function isGroupement(bsff: Bsff): boolean {
  return (
    GROUPING_CODES.includes(bsff.destinationOperationCode) &&
    // this bsff doesn't list any packagings because they are identical to the previous bsffs
    ((bsff.packagings ?? []) as BsffPackaging[]).length === 0
  );
}

/*
 * A reconditionnement is when bsffs are grouped and the packagings are changed.
 */
function isReconditionnement(bsff: Bsff): boolean {
  return (
    GROUPING_CODES.includes(bsff.destinationOperationCode) &&
    ((bsff.packagings ?? []) as BsffPackaging[]).length > 0
  );
}

/*
 * A reexpedition is when there's a single bsff with unchanged packagings and no operation.
 */
function isReexpedition(bsff: Bsff, previousBsffs: Bsff[]): boolean {
  return (
    bsff.destinationOperationCode == null &&
    previousBsffs.length === 1 &&
    ((bsff.packagings ?? []) as BsffPackaging[]).length === 0
  );
}

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
    isSingleCollecte: false,
    isMultiCollecte: false,
    isGroupement: false,
    isReconditionnement: false,
    isReexpedition: false
  };
  if (isGroupement(bsff)) {
    bsffType.isGroupement = true;
  } else if (isReconditionnement(bsff)) {
    bsffType.isReconditionnement = true;
  } else if (isReexpedition(bsff, previousBsffs)) {
    bsffType.isReexpedition = true;
  } else if (ficheInterventions.length > 1) {
    bsffType.isMultiCollecte = true;
  } else {
    bsffType.isSingleCollecte = true;
  }

  const bsffOperation = {
    isRecuperationR2: bsff.destinationOperationCode === OPERATION_CODES.R2,
    isIncinerationD10: bsff.destinationOperationCode === OPERATION_CODES.D10,
    isGroupementR12:
      bsff.destinationOperationCode === OPERATION_CODES.R12 &&
      bsffType.isGroupement,
    isGroupementD13: bsff.destinationOperationCode === OPERATION_CODES.D13,
    isReconditionnementR12:
      bsff.destinationOperationCode === OPERATION_CODES.R12 &&
      bsffType.isReconditionnement,
    isReconditionnementD14:
      bsff.destinationOperationCode === OPERATION_CODES.D14,
    isReexpedition: bsffType.isReexpedition
  };

  return generatePdf(
    mustache.render(await fs.readFile(templatePath, "utf-8"), {
      bsff,
      bsffType,
      bsffOperation,
      packagings: ((bsff.packagings ?? []) as BsffPackaging[])
        .map(
          packaging =>
            `${packaging.name} ${packaging.numero} : ${packaging.kilos} kilo(s)`
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
    })
  );
}
