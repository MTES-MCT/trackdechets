import { Bspaoh, User } from "@prisma/client";
import { BspaohInput, BspaohSignatureType } from "@td/codegen-back";
import { getUserRoles } from "../../permissions";
import { editionRules } from "./rules";
import { SealedFieldError } from "../../common/errors";
import { flattenBspaohInput } from "../converter";
import { objectDiff } from "../../forms/workflow/diff";

export async function checkEditionRules(
  bspaoh: Bspaoh,
  input: BspaohInput,
  user?: User
) {
  if (["DRAFT", "INITIAL"].includes(bspaoh.status)) {
    return true;
  }

  const userSirets = user?.id ? Object.keys(await getUserRoles(user.id)) : [];
  const isEmitter =
    bspaoh.emitterCompanySiret &&
    userSirets.includes(bspaoh.emitterCompanySiret);

  if (bspaoh.status === "SIGNED_BY_PRODUCER" && isEmitter) {
    return true;
  }

  const sealedFieldErrors: string[] = [];

  const updatedFields = await getUpdatedFields(bspaoh, input);

  // Inner function used to recursively checks that the diff
  // does not contain any fields sealed by signature
  function checkSealedFields(
    signatureType: BspaohSignatureType | null,
    editableFields: string[]
  ) {
    if (signatureType === null) {
      return checkSealedFields(
        "EMISSION",
        editableFields.filter(
          field => editionRules[field].sealedBy !== "EMISSION"
        )
      );
    }

    if (isAwaitingSignature(signatureType, bspaoh)) {
      // do not perform additional checks if we are still awaiting
      // for this signature type
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
        editableFields.filter(
          field => editionRules[field].sealedBy !== signature.next
        )
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
  bspaoh: Bspaoh,
  input: BspaohInput
): Promise<string[]> {
  const flatInput = flattenBspaohInput(input);

  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = {
    ...Object.keys(flatInput).reduce((acc, field) => {
      return { ...acc, [field]: bspaoh[field] };
    }, {})
  };

  const diff = objectDiff(flatInput, compareTo);

  return Object.keys(diff);
}

export const SIGNATURES_HIERARCHY: {
  [key in BspaohSignatureType]: {
    field: keyof Bspaoh;
    next?: BspaohSignatureType;
  };
} = {
  EMISSION: { field: "emitterEmissionSignatureDate", next: "TRANSPORT" },
  TRANSPORT: {
    field: "emitterEmissionSignatureDate",
    next: "RECEPTION"
  },
  DELIVERY: { field: "handedOverToDestinationSignatureDate" },
  RECEPTION: { field: "destinationReceptionSignatureDate", next: "OPERATION" },
  OPERATION: { field: "destinationOperationSignatureDate" }
};

export function isAwaitingSignature(type: BspaohSignatureType, bspaoh: Bspaoh) {
  const signature = SIGNATURES_HIERARCHY[type];
  if (bspaoh[signature.field]) {
    return false;
  }
  if (signature.next) {
    return isAwaitingSignature(signature.next, bspaoh);
  }
  return true;
}
