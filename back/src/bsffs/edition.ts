import { Bsff, BsffPackaging, User } from "@prisma/client";
import { safeInput } from "../common/converter";
import { SealedFieldError } from "../common/errors";
import { getCachedUserSiretOrVat } from "../common/redis/users";
import { objectDiff } from "../forms/workflow/diff";
import { BsffInput, BsffSignatureType } from "../generated/graphql/types";
import { flattenBsffInput } from "./converter";
import {
  getReadonlyBsffPackagingRepository,
  getReadonlyBsffRepository
} from "./repository";
import bsff from "./resolvers/queries/bsff";

type BsffSignatureTypeUntilReception = Extract<
  BsffSignatureType,
  "EMISSION" | "TRANSPORT" | "RECEPTION"
>;

// Defines until which signature BSFF fields can be modified
// The test in edition.test.ts ensures that every possible key in BsffInput
// has a corresponding edition rule
export const editionRules = {
  type: "EMISSION",
  emitterCompanyName: "EMISSION",
  emitterCompanySiret: "EMISSION",
  emitterCompanyAddress: "EMISSION",
  emitterCompanyContact: "EMISSION",
  emitterCompanyPhone: "EMISSION",
  emitterCompanyMail: "EMISSION",
  emitterCustomInfo: "EMISSION",
  wasteCode: "EMISSION",
  wasteDescription: "EMISSION",
  wasteAdr: "EMISSION",
  weightValue: "EMISSION",
  weightIsEstimate: "EMISSION",
  transporterCompanyName: "TRANSPORT",
  transporterCompanySiret: "TRANSPORT",
  transporterCompanyVatNumber: "TRANSPORT",
  transporterCompanyAddress: "TRANSPORT",
  transporterCompanyContact: "TRANSPORT",
  transporterCompanyPhone: "TRANSPORT",
  transporterCompanyMail: "TRANSPORT",
  transporterCustomInfo: "TRANSPORT",
  transporterRecepisseNumber: "TRANSPORT",
  transporterRecepisseDepartment: "TRANSPORT",
  transporterRecepisseValidityLimit: "TRANSPORT",
  transporterTransportMode: "TRANSPORT",
  transporterTransportPlates: "TRANSPORT",
  transporterTransportTakenOverAt: "TRANSPORT",
  destinationCompanyName: "EMISSION",
  destinationCompanySiret: "EMISSION",
  destinationCompanyAddress: "EMISSION",
  destinationCompanyContact: "EMISSION",
  destinationCompanyPhone: "EMISSION",
  destinationCompanyMail: "EMISSION",
  destinationCap: "EMISSION",
  destinationCustomInfo: "OPERATION",
  destinationReceptionDate: "RECEPTION",
  destinationPlannedOperationCode: "EMISSION",
  ficheInterventions: "EMISSION",
  forwarding: "EMISSION",
  grouping: "EMISSION",
  repackaging: "EMISSION"
};

export async function checkEditionRules(
  existingBsff: Bsff & {
    packagings: BsffPackaging[];
  },
  input: BsffInput,
  user?: User
) {
  if (existingBsff.status === "INITIAL") {
    return true;
  }

  const userSirets = user?.id ? await getCachedUserSiretOrVat(user.id) : [];
  const isEmitter = userSirets.includes(existingBsff.emitterCompanySiret);

  const { packagings, ...bsff } = existingBsff;

  const sealedFieldErrors: string[] = [];

  const updatedFields = await getUpdatedFields(existingBsff, input);

  // Inner function used to recursively checks that the diff
  // does not contain any fields sealed by signature
  function checkSealedFields(
    signatureType: BsffSignatureTypeUntilReception,
    editableFields: string[]
  ) {
    if (signatureType === null) {
      return checkSealedFields(
        "EMISSION",
        editableFields.filter(field => editionRules[field] !== "EMISSION")
      );
    }

    if (
      isAwaitingSignature(signatureType, bsff) ||
      (signatureType === "EMISSION" && isEmitter)
    ) {
      // do not perform additional checks if we are still awaiting
      // for this signature type or if the emitter is updating is own signed data
      return true;
    }
    for (const field of updatedFields) {
      if (!editableFields.includes(field)) {
        sealedFieldErrors.push(field);
      }
    }

    const signature = SIGNATURES_HIERARCHY[signatureType];

    if (signature.next) {
      return checkSealedFields(
        signature.next,
        editableFields.filter(field => editionRules[field] !== signature.next)
      );
    }
  }

  checkSealedFields(null, Object.keys(editionRules));

  if (sealedFieldErrors?.length > 0) {
    throw new SealedFieldError(sealedFieldErrors);
  }

  return true;
}

/**
 * Computes all the fields that will be updated
 * If a field is present in the input but has the same value as the
 * data present in the DB, we do not return it as we want to
 * allow reposting fields if they are not modified
 */
async function getUpdatedFields(
  existingBsff: Bsff & {
    packagings: BsffPackaging[];
  },
  input: BsffInput
): Promise<string[]> {
  const updatedFields = [];

  const flatInput = safeInput({
    ...flattenBsffInput(input),
    packagings: input.packagings,
    ficheInterventions: input.ficheInterventions,
    forwarding: input.forwarding,
    grouping: input.grouping,
    repackaging: input.repackaging
  });
  const { packagings, ...bsff } = existingBsff;

  const { findPreviousPackagings } = getReadonlyBsffPackagingRepository();
  const { findUniqueGetFicheInterventions } = getReadonlyBsffRepository();
  const previousPackagings = await findPreviousPackagings(
    packagings.map(p => p.id),
    1
  );
  const ficheInterventions = await findUniqueGetFicheInterventions({
    where: { id: existingBsff.id }
  });

  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = {
    ...Object.keys(flatInput).reduce((acc, field) => {
      return { ...acc, [field]: bsff[field] };
    }, {}),
    ...(input.packagings
      ? {
          packagings: packagings?.map(packaging => ({
            numero: packaging.numero,
            volume: packaging.volume,
            weight: packaging.weight,
            type: packaging.type
          }))
        }
      : {}),
    ...(input.ficheInterventions
      ? { ficheInterventions: ficheInterventions.map(p => p.id) }
      : {}),
    ...(input.grouping ? { grouping: previousPackagings.map(p => p.id) } : {}),
    ...(input.forwarding
      ? { forwarding: previousPackagings.map(p => p.id) }
      : {}),
    ...(input.repackaging
      ? { repackaging: previousPackagings.map(p => p.id) }
      : {})
  };

  const diff = objectDiff(flatInput, compareTo);

  for (const field of Object.keys(diff)) {
    updatedFields.push(field);
  }

  return updatedFields;
}

const SIGNATURES_HIERARCHY: {
  [key in BsffSignatureTypeUntilReception]: {
    field: keyof Bsff;
    next?: BsffSignatureTypeUntilReception;
  };
} = {
  EMISSION: { field: "emitterEmissionSignatureDate", next: "TRANSPORT" },
  TRANSPORT: {
    field: "transporterTransportSignatureDate",
    next: "RECEPTION"
  },
  RECEPTION: { field: "destinationReceptionSignatureDate" }
};

/**
 * Checks if the BSFF is awaiting a specific signature type
 * Some signatures may be skipped in some situation so we need to checks recursively in
 * the signature hierarchy
 * For example if the "EMISSION" signature has been skipped because the emitter
 * is a private individual we want `isAwaitingSignature("EMISSION", bsff)` to return
 * false when another signature (ex: TRANSPORT) has been made
 */
export function isAwaitingSignature(
  type: BsffSignatureTypeUntilReception,
  bsff: Bsff
) {
  const signature = SIGNATURES_HIERARCHY[type];
  if (bsff[signature.field]) {
    return false;
  }
  if (signature.next) {
    return isAwaitingSignature(signature.next, bsff);
  }
  return true;
}
