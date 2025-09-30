import {
  Bsff,
  BsffPackaging,
  BsffPackagingType,
  BsffStatus,
  WasteAcceptationStatus
} from "@td/prisma";
import { prisma as prismaClient } from "@td/prisma";
import { RepositoryFnDeps } from "../common/repository/types";
import type { BsffPackagingInput } from "@td/codegen-back";
import { isFinalOperation } from "./constants";
import { getReadonlyBsffPackagingRepository } from "./repository";
import { Nullable } from "../types";
import { UserInputError } from "../common/errors";

type BsffDestination = {
  receptionWeight: number;
  receptionAcceptationStatus: WasteAcceptationStatus;
  receptionDate: Date;
  receptionRefusalReason: string;
  operationCode: string;
  operationMode: string;
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
): Nullable<BsffDestination> {
  const hasAnyReception = packagings.some(p => !!p.acceptationSignatureDate);

  const receptionWeight = hasAnyReception
    ? packagings.reduce((acc, p) => {
        return acc + (p.acceptationWeight ?? 0);
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

  // returns last date
  const receptionDate = hasAnyReception
    ? [...packagings.map(p => p.acceptationDate).filter(Boolean)].sort(
        (d1, d2) => d2.getTime() - d1.getTime()
      )[0]
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

  const operationModes = hasAnyOperation
    ? packagings
        .filter(p => !!p.operationSignatureDate && !!p.operationMode)
        .map(p => p.operationMode)
    : [];

  const operationMode = hasAnyOperation
    ? [...new Set(operationModes)].join(" ")
    : null;

  // returns last date
  const operationDate = hasAnyOperation
    ? [...packagings.map(p => p.operationDate).filter(Boolean)].sort(
        (d1, d2) => d2.getTime() - d1.getTime()
      )[0]
    : null;

  return {
    receptionDate,
    receptionWeight,
    receptionAcceptationStatus,
    receptionRefusalReason,
    operationCode,
    operationMode,
    operationDate
  };
}

/**
 * Compute BSFF status based on the acceptation and processing information
 * of each packaging
 */
export async function getStatus(
  bsff: Bsff & { packagings?: BsffPackaging[] },
  ctx?: RepositoryFnDeps
) {
  const prisma = ctx?.prisma ?? prismaClient;

  const { findNextPackagings } = getReadonlyBsffPackagingRepository(prisma);

  const packagingsSimple =
    bsff.packagings ??
    (await prisma.bsff.findUnique({ where: { id: bsff.id } }).packagings());

  const packagings = await Promise.all(
    packagingsSimple?.map(async p => ({
      ...p,
      lastPackaging: (await findNextPackagings(p.id)).reverse()[0]
    })) ?? []
  );

  let allAccepted = true,
    allRefused = true,
    allAcceptedOrRefused = true,
    allProcessed = true,
    allIntermediatelyProcessed = true,
    allProcessedOrIntermediatelyProcessed = true;

  for (const packaging of packagings) {
    const accepted =
      !!packaging.acceptationSignatureDate &&
      packaging.acceptationStatus === WasteAcceptationStatus.ACCEPTED;
    const refused =
      (!!packaging.lastPackaging?.acceptationSignatureDate &&
        packaging.lastPackaging?.acceptationStatus ===
          WasteAcceptationStatus.REFUSED) ||
      (!!packaging.acceptationSignatureDate &&
        packaging.acceptationStatus === WasteAcceptationStatus.REFUSED);
    const acceptedOrRefused = accepted || refused;
    const processed =
      refused ||
      (!!packaging.operationSignatureDate &&
        ((!!packaging.operationCode &&
          isFinalOperation(
            packaging.operationCode,
            packaging.operationNoTraceability
          )) ||
          (!!packaging.lastPackaging?.operationCode &&
            isFinalOperation(
              packaging.lastPackaging.operationCode,
              packaging.lastPackaging?.operationNoTraceability
            ))));
    const intermediatelyProcessed =
      refused ||
      (!!packaging.operationSignatureDate &&
        !!packaging.operationCode &&
        !isFinalOperation(
          packaging.operationCode,
          packaging.operationNoTraceability
        ));
    const processedOrIntermediatelyProcessed =
      processed || intermediatelyProcessed;

    allAccepted = allAccepted && accepted;
    allRefused = allRefused && refused;
    allAcceptedOrRefused = allAcceptedOrRefused && acceptedOrRefused;
    allProcessed = allProcessed && processed;
    allIntermediatelyProcessed =
      allIntermediatelyProcessed && intermediatelyProcessed;
    allProcessedOrIntermediatelyProcessed =
      allProcessedOrIntermediatelyProcessed &&
      processedOrIntermediatelyProcessed;
  }

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

/**
 * Make packaging with `name` retro compatible with packaging with `type`
 */
export function toBsffPackagingWithType({
  name,
  ...packaging
}: BsffPackagingInput): BsffPackagingInput & { type: BsffPackagingType } {
  if (!packaging.type && !name) {
    throw new UserInputError(
      "Vous devez préciser le type de contenant : ex: BOUTEILLE"
    );
  }

  if (!!packaging.type && !!name) {
    throw new UserInputError(
      "Vous ne pouvez pas préciser à la fois le champ `type` et le champ `name`"
    );
  }

  let type = packaging.type;
  let other = packaging.other;
  if (!packaging.type) {
    type =
      name?.toLowerCase() === "bouteille"
        ? BsffPackagingType.BOUTEILLE
        : BsffPackagingType.AUTRE;
    if (type === BsffPackagingType.AUTRE) {
      other = name;
    }
  }

  return {
    ...packaging,
    type: type!,
    other
  };
}
