import { Bsvhu, User } from "@prisma/client";
import { SealedFieldError } from "../common/errors";
import { getCachedUserSiretOrVat } from "../common/redis/users";
import { objectDiff } from "../forms/workflow/diff";
import { BsvhuInput, SignatureTypeInput } from "../generated/graphql/types";
import { flattenVhuInput } from "./converter";

// Defines until which signature BSVHU fields can be modified
// The test in edition.test.ts ensures that every possible key in BsvhuInput
// has a corresponding edition rule
export const editionRules: { [key: string]: SignatureTypeInput } = {
  emitterAgrementNumber: "EMISSION",
  emitterCompanyName: "EMISSION",
  emitterCompanySiret: "EMISSION",
  emitterCompanyAddress: "EMISSION",
  emitterCompanyContact: "EMISSION",
  emitterCompanyPhone: "EMISSION",
  emitterCompanyMail: "EMISSION",
  destinationType: "EMISSION",
  destinationAgrementNumber: "OPERATION",
  destinationCompanyName: "OPERATION",
  destinationCompanySiret: "OPERATION",
  destinationCompanyAddress: "OPERATION",
  destinationCompanyContact: "OPERATION",
  destinationCompanyPhone: "OPERATION",
  destinationCompanyMail: "OPERATION",
  destinationPlannedOperationCode: "EMISSION",
  destinationReceptionQuantity: "OPERATION",
  destinationReceptionWeight: "OPERATION",
  destinationReceptionIdentificationNumbers: "OPERATION",
  destinationReceptionIdentificationType: "OPERATION",
  destinationReceptionAcceptationStatus: "OPERATION",
  destinationReceptionRefusalReason: "OPERATION",
  destinationReceptionDate: "OPERATION",
  destinationOperationCode: "OPERATION",
  destinationOperationNextDestinationCompanyName: "OPERATION",
  destinationOperationDate: "OPERATION",
  destinationOperationNextDestinationCompanySiret: "OPERATION",
  destinationOperationNextDestinationCompanyAddress: "OPERATION",
  destinationOperationNextDestinationCompanyContact: "OPERATION",
  destinationOperationNextDestinationCompanyPhone: "OPERATION",
  destinationOperationNextDestinationCompanyMail: "OPERATION",
  destinationOperationNextDestinationCompanyVatNumber: "OPERATION",
  transporterCompanyName: "TRANSPORT",
  transporterCompanySiret: "TRANSPORT",
  transporterCompanyAddress: "TRANSPORT",
  transporterCompanyContact: "TRANSPORT",
  transporterCompanyPhone: "TRANSPORT",
  transporterCompanyMail: "TRANSPORT",
  transporterCompanyVatNumber: "TRANSPORT",
  transporterRecepisseNumber: "TRANSPORT",
  transporterRecepisseDepartment: "TRANSPORT",
  transporterRecepisseValidityLimit: "TRANSPORT",
  transporterTransportTakenOverAt: "TRANSPORT",
  packaging: "EMISSION",
  wasteCode: "EMISSION",
  quantity: "EMISSION",
  identificationNumbers: "EMISSION",
  identificationType: "EMISSION",
  weightValue: "EMISSION",
  weightIsEstimate: "EMISSION"
};

export async function checkEditionRules(
  bsvhu: Bsvhu,
  input: BsvhuInput,
  user?: User
) {
  if (bsvhu.status === "INITIAL") {
    return true;
  }

  const userSirets = user?.id ? await getCachedUserSiretOrVat(user.id) : [];
  const isEmitter = userSirets.includes(bsvhu.emitterCompanySiret);

  const sealedFieldErrors: string[] = [];

  const updatedFields = getUpdatedFields(bsvhu, input);

  // Inner function used to recursively checks that the diff
  // does not contain any fields sealed by signature
  function checkSealedFields(
    signatureType: SignatureTypeInput,
    editableFields: string[]
  ) {
    if (signatureType === null) {
      return checkSealedFields(
        "EMISSION",
        editableFields.filter(field => editionRules[field] !== "EMISSION")
      );
    }

    if (
      isAwaitingSignature(signatureType, bsvhu) ||
      (signatureType === "EMISSION" && isEmitter)
    ) {
      // do not perform additional checks if we are still awaiting
      // for this signature type or if the emitter is updating ihs own signed data
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
    throw new SealedFieldError([...new Set(sealedFieldErrors)]);
  }

  return true;
}

/**
 * Computes all the fields that will be updated
 * If a field is present in the input but has the same value as the
 * data present in the DB, we do not return it as we want to
 * allow reposting fields if they are not modified
 */
function getUpdatedFields(bsvhu: Bsvhu, input: BsvhuInput): string[] {
  const updatedFields = [];

  const flatInput = flattenVhuInput(input);
  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = {
    ...Object.keys(flatInput).reduce((acc, field) => {
      return { ...acc, [field]: bsvhu[field] };
    }, {})
  };

  const diff = objectDiff(flatInput, compareTo);

  for (const field of Object.keys(diff)) {
    updatedFields.push(field);
  }

  return updatedFields;
}

const SIGNATURES_HIERARCHY: {
  [key in SignatureTypeInput]: {
    field: keyof Bsvhu;
    next?: SignatureTypeInput;
  };
} = {
  EMISSION: { field: "emitterEmissionSignatureDate", next: "TRANSPORT" },
  TRANSPORT: {
    field: "transporterTransportSignatureDate",
    next: "OPERATION"
  },
  OPERATION: { field: "destinationOperationSignatureDate" }
};

/**
 * Checks if the BSDA is awaiting a specific signature type
 * Some signatures may be skipped in some situation so we need to checks recursively in
 * the signature hierarchy
 * For example if the "EMISSION" signature has been skipped because the emitter
 * is a private individual we want `isAwaitingSignature("EMISSION", bsda)` to return
 * false when another signature (ex: TRANSPORT) has been made
 */
export function isAwaitingSignature(type: SignatureTypeInput, bsda: Bsvhu) {
  const signature = SIGNATURES_HIERARCHY[type];
  if (bsda[signature.field]) {
    return false;
  }
  if (signature.next) {
    return isAwaitingSignature(signature.next, bsda);
  }
  return true;
}
