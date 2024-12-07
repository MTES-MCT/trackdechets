import { BsffPackaging, Prisma } from "@prisma/client";
import { SealedFieldError } from "../../common/errors";
import { objectDiff } from "../../forms/workflow/diff";
import { BsffSignatureType, UpdateBsffPackagingInput } from "@td/codegen-back";
import { flattenBsffPackagingInput } from "../converter";

type BsffSignatureTypeAfterReception = Extract<
  BsffSignatureType,
  "ACCEPTATION" | "OPERATION"
>;
type EditableBsffPackagingFields = Required<
  Omit<
    Prisma.BsffPackagingCreateInput,
    | "id"
    | "type"
    | "other"
    | "volume"
    | "weight"
    | "emissionNumero"
    | "acceptationSignatureAuthor"
    | "acceptationSignatureDate"
    | "operationSignatureAuthor"
    | "operationSignatureDate"
    | "bsff"
    | "nextPackaging"
    | "previousPackagings"
    | "finalOperations"
    | "FinalOperationToFinalBsffPackaging"
  >
>;
// Defines until which signature BsffPackaging fields can be modified
// The test in bsffPackagingEdition.test.ts ensures that every possible key in BsffPackagingInput
// has a corresponding edition rule
export const editionRules: {
  [key in keyof EditableBsffPackagingFields]: BsffSignatureType;
} = {
  numero: "ACCEPTATION",
  acceptationDate: "ACCEPTATION",
  acceptationStatus: "ACCEPTATION",
  acceptationWeight: "ACCEPTATION",
  acceptationRefusalReason: "ACCEPTATION",
  acceptationWasteCode: "ACCEPTATION",
  acceptationWasteDescription: "ACCEPTATION",
  operationDate: "OPERATION",
  operationCode: "OPERATION",
  operationMode: "OPERATION",
  operationDescription: "OPERATION",
  operationNoTraceability: "OPERATION",
  operationNextDestinationPlannedOperationCode: "OPERATION",
  operationNextDestinationCap: "OPERATION",
  operationNextDestinationCompanyName: "OPERATION",
  operationNextDestinationCompanySiret: "OPERATION",
  operationNextDestinationCompanyVatNumber: "OPERATION",
  operationNextDestinationCompanyAddress: "OPERATION",
  operationNextDestinationCompanyContact: "OPERATION",
  operationNextDestinationCompanyPhone: "OPERATION",
  operationNextDestinationCompanyMail: "OPERATION"
};

export async function checkEditionRules(
  existingBsffPackaging: BsffPackaging,
  input: UpdateBsffPackagingInput
) {
  const sealedFieldErrors: string[] = [];

  const updatedFields = await getUpdatedFields(existingBsffPackaging, input);

  // Inner function used to recursively checks that the diff
  // does not contain any fields sealed by signature
  function checkSealedFields(
    signatureType: BsffSignatureTypeAfterReception | null,
    editableFields: string[]
  ) {
    if (signatureType === null) {
      return checkSealedFields(
        "ACCEPTATION",
        editableFields.filter(field => editionRules[field] !== "ACCEPTATION")
      );
    }

    if (isAwaitingSignature(signatureType, existingBsffPackaging)) {
      // do not perform additional checks if we are still awaiting
      // for this signature type or if the emitter is updating his own signed data
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
async function getUpdatedFields(
  existingBsffPackaging: BsffPackaging,
  input: UpdateBsffPackagingInput
): Promise<string[]> {
  const flatInput = flattenBsffPackagingInput(input);

  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = {
    ...Object.keys(flatInput).reduce((acc, field) => {
      return { ...acc, [field]: existingBsffPackaging[field] };
    }, {})
  };

  const diff = objectDiff(flatInput, compareTo);

  return Object.keys(diff);
}

const SIGNATURES_HIERARCHY: {
  [key in BsffSignatureTypeAfterReception]: {
    field: keyof BsffPackaging;
    next?: BsffSignatureTypeAfterReception;
  };
} = {
  ACCEPTATION: {
    field: "acceptationSignatureDate",
    next: "OPERATION"
  },
  OPERATION: { field: "operationSignatureDate" }
};

/**
 * Checks if the BsffPackaging is awaiting a specific signature type
 */
export function isAwaitingSignature(
  type: BsffSignatureTypeAfterReception,
  bsffPackaging: BsffPackaging
) {
  const signature = SIGNATURES_HIERARCHY[type];
  if (bsffPackaging[signature.field]) {
    return false;
  }
  if (signature.next) {
    return isAwaitingSignature(signature.next, bsffPackaging);
  }
  return true;
}
