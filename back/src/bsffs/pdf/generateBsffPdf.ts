import path from "path";
import fs from "fs/promises";
import mustache from "mustache";
import { format } from "date-fns";
import { Bsff } from ".prisma/client";
import prisma from "../../prisma";
import { BsffPackaging } from "../../generated/graphql/types";
import { generatePdf } from "../../common/pdf";
import { OPERATION_CODES, OPERATION_QUALIFICATIONS } from "../constants";

const templatePath = require.resolve(
  path.join(__dirname, "assets", "pdf.html")
);

export async function generateBsffPdf(bsff: Bsff) {
  const associatedBsffs = await prisma.bsff.findMany({
    where: {
      bsffId: bsff.id
    }
  });

  const bsffType = {
    isCollecte: false,
    isGroupement: false,
    isReconditionnement: false,
    isReexpedition: false
  };
  switch (associatedBsffs[0]?.destinationOperationQualification) {
    case OPERATION_QUALIFICATIONS.GROUPEMENT: {
      bsffType.isGroupement = true;
      break;
    }
    case OPERATION_QUALIFICATIONS.RECONDITIONNEMENT: {
      bsffType.isReconditionnement = true;
      break;
    }
    case OPERATION_QUALIFICATIONS.REEXPEDITION: {
      bsffType.isReexpedition = true;
      break;
    }
    default: {
      bsffType.isCollecte = true;
      break;
    }
  }

  const bsffOperation = {
    isRecuperationR2:
      bsff.destinationOperationCode === OPERATION_CODES.R2 &&
      bsff.destinationOperationQualification ===
        OPERATION_QUALIFICATIONS.RECUPERATION_REGENERATION,
    isIncinerationD10:
      bsff.destinationOperationCode === OPERATION_CODES.D10 &&
      bsff.destinationOperationQualification ===
        OPERATION_QUALIFICATIONS.INCINERATION,
    isGroupementR12:
      bsff.destinationOperationCode === OPERATION_CODES.R12 &&
      bsff.destinationOperationQualification ===
        OPERATION_QUALIFICATIONS.GROUPEMENT,
    isGroupementD13:
      bsff.destinationOperationCode === OPERATION_CODES.D13 &&
      bsff.destinationOperationQualification ===
        OPERATION_QUALIFICATIONS.GROUPEMENT,
    isReconditionnementR12:
      bsff.destinationOperationCode === OPERATION_CODES.R12 &&
      bsff.destinationOperationQualification ===
        OPERATION_QUALIFICATIONS.RECONDITIONNEMENT,
    isReconditionnementD14:
      bsff.destinationOperationCode === OPERATION_CODES.D14 &&
      bsff.destinationOperationQualification ===
        OPERATION_QUALIFICATIONS.RECONDITIONNEMENT,
    isReexpedition:
      bsff.destinationOperationQualification ===
      OPERATION_QUALIFICATIONS.REEXPEDITION
  };

  const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
    where: {
      bsffId: bsff.id
    }
  });

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
