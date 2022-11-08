import {
  Bsff,
  BsffPackaging,
  BsffStatus,
  WasteAcceptationStatus
} from "@prisma/client";
import { isFinalOperation } from "./constants";
import { getNextPackagings } from "./database";

type BsffDestination = {
  receptionWeight: number;
  receptionAcceptationStatus: WasteAcceptationStatus;
  receptionRefusalReason: string;
  operationCode: string;
  operationDate: Date;
};

/**
 * En comparaison aux autres bordereaux, l'acceptation et l'opération
 * s'effectue sur le BSFF au niveau des contenants. Cette fonction
 * permet de calculer des valeurs pour la réception et l'opération
 * au niveau du BSFF à partir des informations au niveau des contenants.
 */
export function toBsffDestination(
  packagings: BsffPackaging[]
): BsffDestination {
  const hasAnyReception = packagings.some(p => !!p.acceptationSignatureDate);

  const receptionWeight = hasAnyReception
    ? packagings.reduce((acc, p) => {
        return acc + p.acceptationWeight ?? 0;
      }, 0)
    : null;

  const receptionAcceptationStatus = hasAnyReception
    ? (function () {
        const anyAccepted = packagings.some(
          p =>
            !!p.acceptationSignatureDate &&
            p.acceptationStatus === WasteAcceptationStatus.ACCEPTED
        );
        const anyRefused = packagings.some(
          p =>
            !!p.acceptationSignatureDate &&
            p.acceptationStatus === WasteAcceptationStatus.REFUSED
        );

        if (anyAccepted && !anyRefused) {
          return WasteAcceptationStatus.ACCEPTED;
        } else if (anyAccepted && anyRefused) {
          return WasteAcceptationStatus.PARTIALLY_REFUSED;
        } else if (!anyAccepted && anyRefused) {
          return WasteAcceptationStatus.REFUSED;
        } else {
          return null;
        }
      })()
    : null;

  const receptionRefusalReason = [
    WasteAcceptationStatus.REFUSED,
    WasteAcceptationStatus.PARTIALLY_REFUSED
  ].includes(receptionAcceptationStatus as any)
    ? packagings
        .filter(
          p => !!p.acceptationSignatureDate && !!p.acceptationRefusalReason
        )
        .map(p => `${p.numero} : ${p.acceptationRefusalReason}`)
        .join("\n")
    : null;

  const hasAnyOperation = packagings.some(
    p => !!p.operationSignatureDate && !!p.operationCode
  );

  const operationCodes = hasAnyOperation
    ? packagings
        .filter(p => !!p.operationSignatureDate && !!p.operationCode)
        .map(p => p.operationCode)
    : [];

  const operationCode = hasAnyOperation
    ? [...new Set(operationCodes)].join(" ")
    : null;

  // returns last date
  const operationDate = hasAnyOperation
    ? [
        ...packagings.filter(p => !!p.operationDate).map(p => p.operationDate)
      ].sort((d1, d2) => d2.getTime() - d1.getTime())[0]
    : null;

  return {
    receptionWeight,
    receptionAcceptationStatus,
    receptionRefusalReason,
    operationCode,
    operationDate
  };
}

/**
 * Compute BSFF status based on the acceptation and processing information
 * of each packaging
 */
export async function getStatus(bsff: Bsff & { packagings: BsffPackaging[] }) {
  const packagings = await Promise.all(
    bsff.packagings.map(async p => ({
      ...p,
      lastPackaging: (await getNextPackagings(p.id)).reverse()[0]
    }))
  );

  const {
    allAccepted,
    allRefused,
    allAcceptedOrRefused,
    allProcessed,
    allIntermediatelyProcessed,
    allProcessedOrIntermediatelyProcessed
  } = packagings.reduce(
    (acc, packaging) => {
      const accepted =
        !!packaging.acceptationSignatureDate &&
        packaging.acceptationStatus === WasteAcceptationStatus.ACCEPTED;
      const refused =
        !!packaging.acceptationSignatureDate &&
        packaging.acceptationStatus === WasteAcceptationStatus.REFUSED;
      const acceptedOrRefused = accepted || refused;
      const processed =
        refused ||
        (!!packaging.operationSignatureDate &&
          (isFinalOperation(
            packaging.operationCode,
            packaging.operationNoTraceability
          ) ||
            isFinalOperation(
              packaging.lastPackaging?.operationCode,
              packaging.lastPackaging?.operationNoTraceability
            )));
      const intermediatelyProcessed =
        refused ||
        (!!packaging.operationSignatureDate &&
          !isFinalOperation(
            packaging.operationCode,
            packaging.operationNoTraceability
          ));
      const processedOrIntermediatelyProcessed =
        processed || intermediatelyProcessed;

      return {
        allAccepted: acc.allAccepted && accepted,
        allRefused: acc.allRefused && refused,
        allAcceptedOrRefused: acc.allAcceptedOrRefused && acceptedOrRefused,
        allProcessed: acc.allProcessed && processed,
        allIntermediatelyProcessed:
          acc.allIntermediatelyProcessed && intermediatelyProcessed,
        allProcessedOrIntermediatelyProcessed:
          acc.allProcessedOrIntermediatelyProcessed &&
          processedOrIntermediatelyProcessed
      };
    },
    {
      // Tous les contenants ont été acceptés
      allAccepted: true,
      // Tous les contenants ont été refusés
      allRefused: true,
      // Tous les contenants ont été acceptés ou refusés
      allAcceptedOrRefused: true,
      // Tous les contenants ont été traités (régénération ou destruction)
      allProcessed: true,
      // Tous les contenants ont été groupés, reconditionnés ou réexpédiés
      allIntermediatelyProcessed: true,
      // Tous les contenants ont été soit traités, soit groupés, soit reconditionnés soit réexpédiés
      allProcessedOrIntermediatelyProcessed: true
    }
  );

  if (allRefused) {
    return BsffStatus.REFUSED;
  }

  if (allProcessed) {
    return BsffStatus.PROCESSED;
  }

  if (allIntermediatelyProcessed || allProcessedOrIntermediatelyProcessed) {
    return BsffStatus.INTERMEDIATELY_PROCESSED;
  }

  if (allAccepted) {
    return BsffStatus.ACCEPTED;
  }

  if (allAcceptedOrRefused) {
    return BsffStatus.PARTIALLY_REFUSED;
  }

  return bsff.status;
}
