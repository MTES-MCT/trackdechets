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
 * Check if the bsff lists all the packagings from the associated bsffs.
 */
function hasSamePackagings(bsff: Bsff, associatedBsff: Bsff[]): boolean {
  const packagings = ((bsff.packagings ?? []) as BsffPackaging[]).slice();
  const associatedPackagings = associatedBsff.flatMap(
    bsff => (bsff.packagings ?? []) as BsffPackaging[]
  );

  if (associatedPackagings.length !== packagings.length) {
    return false;
  }

  for (const associatedPackaging of associatedPackagings) {
    const packagingIndex = packagings.findIndex(
      packaging =>
        packaging.type === associatedPackaging.type &&
        packaging.kilos === associatedPackaging.kilos &&
        packaging.numero === associatedPackaging.numero
    );
    if (packagingIndex === -1) {
      return false;
    }

    packagings.splice(packagingIndex, 1);
  }
}

/*
 * A groupement is when the packagings don't change,
 * they're just grouped together.
 */
function isGroupement(bsff: Bsff, associatedBsff: Bsff[]): boolean {
  return (
    GROUPING_CODES.includes(bsff.destinationOperationCode) &&
    hasSamePackagings(bsff, associatedBsff)
  );
}

/*
 * A reconditionnement is when the packagings have changed.
 */
function isReconditionnement(bsff: Bsff, associatedBsffs: Bsff[]): boolean {
  return (
    GROUPING_CODES.includes(bsff.destinationOperationCode) &&
    !hasSamePackagings(bsff, associatedBsffs)
  );
}

/*
 * A reexpedition is when a single packaging was stored temporarily
 * before being sent elsewhere.
 */
function isReexpedition(bsff: Bsff, associatedBsffs: Bsff[]): boolean {
  return (
    bsff.destinationOperationCode == null &&
    associatedBsffs.length === 1 &&
    hasSamePackagings(bsff, associatedBsffs)
  );
}

export async function generateBsffPdf(bsff: Bsff) {
  const associatedBsffs = await prisma.bsff.findMany({
    where: {
      bsffId: bsff.id
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
  if (isGroupement(bsff, associatedBsffs)) {
    bsffType.isGroupement = true;
  } else if (isReconditionnement(bsff, associatedBsffs)) {
    bsffType.isReconditionnement = true;
  } else if (isReexpedition(bsff, associatedBsffs)) {
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
            `${packaging.type} ${packaging.numero} : ${packaging.kilos} kilo(s)`
        )
        .join(", "),
      ficheInterventions: [
        ...ficheInterventions,

        // Show a minimum of 5 rows
        ...Array.from({ length: 5 - ficheInterventions.length }).fill({})
      ],
      associatedBsffs: [
        ...associatedBsffs,

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
