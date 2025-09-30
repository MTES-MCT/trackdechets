import { User } from "@td/prisma";
import type {
  BsdasriInput,
  SignatureTypeInput,
  BsdasriPackaging
} from "@td/codegen-back";
import { BSDASRI_SIGNATURES_HIERARCHY } from "./constants";
import {
  ZodBsdasri,
  ZodOperationEnum,
  ZodBsdasriWasteCodeEnum
} from "./schema";
import { BsdasriUserFunctions, PrismaBsdasriForParsing } from "./types";
import { getUserCompanies } from "../../users/database";
import { flattenBsdasriInput } from "../converter";
import { safeInput } from "../../common/converter";
import { objectDiff } from "../../forms/workflow/diff";

/**
 * Cette fonction permet de convertir les données d'input GraphQL
 * vers le format attendu par le parsing Zod. Certains champs sont
 * typés en string côté GraphQL mais en enum côté Zod ce qui nous oblige
 * à faire un casting de type.
 */
export function graphQlInputToZodBsdasri(input: BsdasriInput): ZodBsdasri {
  const { ...bsdasriInput } = input;

  const { wasteCode, intermediaries, ...flatBdasriInput } =
    flattenBsdasriInput(bsdasriInput);

  return safeInput({
    ...flatBdasriInput,

    wasteCode: wasteCode as ZodBsdasriWasteCodeEnum,
    intermediaries: intermediaries?.map(i =>
      safeInput({
        siret: i.siret!,
        vatNumber: i.vatNumber,
        address: i.address!,
        name: i.name!,
        contact: i.contact!,
        phone: i.phone,
        mail: i.mail
      })
    )
  });
}

/**
 * Cette fonction permet de convertir les données prisma
 * vers le format attendu par le parsing Zod. Certains champs sont
 * typés en string côté Prisma mais en enum côté Zod ce qui nous oblige
 * à faire un casting de type.
 */
export function prismaToZodBsdasri(
  bsdasri: PrismaBsdasriForParsing
): ZodBsdasri {
  const {
    wasteCode,
    destinationOperationCode,
    emitterWasteWeightValue,
    transporterWasteWeightValue,
    transporterWasteRefusedWeightValue,
    destinationReceptionWasteWeightValue,
    destinationReceptionWasteRefusedWeightValue,
    grouping,
    synthesizing,
    intermediaries,
    ...data
  } = bsdasri;

  return {
    ...data,
    isDeleted: Boolean(bsdasri.isDeleted),
    isDraft: Boolean(bsdasri.isDraft),
    wasteCode: wasteCode as ZodBsdasriWasteCodeEnum,
    emitterWastePackagings:
      bsdasri.emitterWastePackagings as BsdasriPackaging[],

    emitterWasteWeightValue: emitterWasteWeightValue
      ? emitterWasteWeightValue.toNumber()
      : null,
    transporterWasteWeightValue: transporterWasteWeightValue
      ? transporterWasteWeightValue.toNumber()
      : null,
    transporterWastePackagings:
      bsdasri.transporterWastePackagings as BsdasriPackaging[],
    transporterWasteRefusedWeightValue: transporterWasteRefusedWeightValue
      ? transporterWasteRefusedWeightValue.toNumber()
      : null,
    destinationReceptionWasteWeightValue: destinationReceptionWasteWeightValue
      ? destinationReceptionWasteWeightValue.toNumber()
      : null,
    destinationWastePackagings:
      bsdasri.destinationWastePackagings as BsdasriPackaging[],
    destinationReceptionWasteRefusedWeightValue:
      destinationReceptionWasteRefusedWeightValue
        ? destinationReceptionWasteRefusedWeightValue.toNumber()
        : null,
    destinationOperationCode: destinationOperationCode as ZodOperationEnum,
    grouping: grouping.map(bsd => bsd.id),
    synthesizing: synthesizing.map(bsd => bsd.id),
    intermediaries: intermediaries.map(i => {
      const { bsdasriId, id, createdAt, ...intermediaryData } = i;
      return { ...intermediaryData, address: intermediaryData.address! };
    })
  };
}

export function getUpdatedFields<T extends ZodBsdasri>(
  val: T,
  update: T
): string[] {
  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = {
    ...Object.keys(update).reduce((acc, field) => {
      return { ...acc, [field]: val[field] };
    }, {})
  };

  const diff = objectDiff(update, compareTo);

  return Object.keys(diff);
}

export async function getBsdasriUserFunctions(
  user: User | undefined,
  bsdasri: ZodBsdasri
): Promise<BsdasriUserFunctions> {
  const companies = user ? await getUserCompanies(user.id) : [];
  const orgIds = companies.map(c => c.orgId);
  return {
    isEmitter:
      bsdasri.emitterCompanySiret != null &&
      orgIds.includes(bsdasri.emitterCompanySiret),
    isDestination:
      bsdasri.destinationCompanySiret != null &&
      orgIds.includes(bsdasri.destinationCompanySiret),
    isTransporter:
      (bsdasri.transporterCompanySiret != null &&
        orgIds.includes(bsdasri.transporterCompanySiret)) ||
      (bsdasri.transporterCompanyVatNumber != null &&
        orgIds.includes(bsdasri.transporterCompanyVatNumber)),
    isEcoOrganisme:
      bsdasri.ecoOrganismeSiret != null &&
      orgIds.includes(bsdasri.ecoOrganismeSiret),
    isBroker:
      bsdasri.brokerCompanySiret != null &&
      orgIds.includes(bsdasri.brokerCompanySiret),
    isTrader:
      bsdasri.traderCompanySiret != null &&
      orgIds.includes(bsdasri.traderCompanySiret)
  };
}

/**
 * Gets all the signatures prior to the target signature in the signature hierarchy.
 */
export function getSignatureAncestors(
  targetSignature: SignatureTypeInput | undefined | null
): SignatureTypeInput[] {
  if (!targetSignature) return [];

  const parent = Object.entries(BSDASRI_SIGNATURES_HIERARCHY).find(
    ([_, details]) => details.next === targetSignature
  )?.[0];

  return [
    targetSignature,
    ...getSignatureAncestors(parent as SignatureTypeInput)
  ];
}

export function getNextSignatureType(
  currentSignature: SignatureTypeInput | undefined | null
): SignatureTypeInput | undefined {
  if (!currentSignature) {
    return "EMISSION";
  }
  const signature = BSDASRI_SIGNATURES_HIERARCHY[currentSignature];
  if (signature.next) {
    return signature.next;
  }
  return undefined;
}

/**
 * Renvoie la dernière signature en date sur un Dasri
 */
export function getCurrentSignatureType(
  bsdasri: ZodBsdasri
): SignatureTypeInput | undefined {
  /**
   * Fonction interne récursive qui parcourt la hiérarchie des signatures et
   * renvoie les signatures présentes sur le bordereau
   */
  function getSignatures(
    current: SignatureTypeInput,
    acc: SignatureTypeInput[]
  ) {
    const signature = BSDASRI_SIGNATURES_HIERARCHY[current];

    const hasCurrentSignature = signature.isSigned(bsdasri);

    const signatures = [...(hasCurrentSignature ? [current] : []), ...acc];
    if (signature.next) {
      return getSignatures(signature.next, signatures);
    }
    return signatures;
  }

  const signatures = getSignatures("EMISSION", []);

  if (signatures.length > 0) {
    return signatures[0];
  }

  return undefined;
}
