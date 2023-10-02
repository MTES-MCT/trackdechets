import { Bsda, User } from "@prisma/client";
import { SealedFieldError } from "../../common/errors";
import { objectDiff } from "../../forms/workflow/diff";
import { BsdaInput, BsdaSignatureType } from "../../generated/graphql/types";
import { flattenBsdaInput } from "../converter";
import { getReadonlyBsdaRepository } from "../repository";
import { getUserRoles } from "../../permissions";
import { editionRules } from "./rules";

export async function checkEditionRules(
  bsda: Bsda,
  input: BsdaInput,
  user?: User
) {
  if (bsda.status === "INITIAL") {
    return true;
  }

  const userSirets = user?.id ? Object.keys(await getUserRoles(user.id)) : [];
  const isEmitter =
    bsda.emitterCompanySiret && userSirets.includes(bsda.emitterCompanySiret);

  if (bsda.status === "SIGNED_BY_PRODUCER" && isEmitter) {
    return true;
  }

  const sealedFieldErrors: string[] = [];

  const updatedFields = await getUpdatedFields(bsda, input);

  // Inner function used to recursively checks that the diff
  // does not contain any fields sealed by signature
  function checkSealedFields(
    signatureType: BsdaSignatureType | null,
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

    if (isAwaitingSignature(signatureType, bsda)) {
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
  bsda: Bsda,
  input: BsdaInput
): Promise<string[]> {
  const flatInput = flattenBsdaInput(input);

  const { findRelatedEntity } = getReadonlyBsdaRepository();

  const [grouping, intermediaries, forwarding] = await Promise.all([
    findRelatedEntity({ id: bsda.id }).grouping(),
    findRelatedEntity({
      id: bsda.id
    }).intermediaries(),
    findRelatedEntity({ id: bsda.id }).forwarding()
  ]);

  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = {
    ...Object.keys(flatInput).reduce((acc, field) => {
      return { ...acc, [field]: bsda[field] };
    }, {}),
    ...(input.grouping ? { grouping: grouping?.map(g => g.id) } : {}),
    ...(input.forwarding ? { forwarding: forwarding?.id } : {}),
    ...(input.intermediaries
      ? {
          intermediaries: intermediaries?.map(inter => {
            const { bsdaId, id, createdAt, ...input } = inter; // To match the input, we remove some internal fields
            return input;
          })
        }
      : {})
  };

  const diff = objectDiff(flatInput, compareTo);

  return Object.keys(diff);
}

export const SIGNATURES_HIERARCHY: {
  [key in BsdaSignatureType]: { field: keyof Bsda; next?: BsdaSignatureType };
} = {
  EMISSION: { field: "emitterEmissionSignatureDate", next: "WORK" },
  WORK: { field: "workerWorkSignatureDate", next: "TRANSPORT" },
  TRANSPORT: {
    field: "transporterTransportSignatureDate",
    next: "OPERATION"
  },
  OPERATION: { field: "destinationOperationSignatureDate" }
};
export const SIGNATURES_HIERARCHY_KEYS = Object.keys(SIGNATURES_HIERARCHY);

/**
 * Checks if the BSDA is awaiting a specific signature type
 * Some signatures may be skipped in some situation so we need to checks recursively in
 * the signature hierarchy
 * For example if the "EMISSION" signature has been skipped because the emitter
 * is a private individual we want `isAwaitingSignature("EMISSION", bsda)` to return
 * false when another signature (ex: TRANSPORT) has been made
 */
export function isAwaitingSignature(type: BsdaSignatureType, bsda: Bsda) {
  const signature = SIGNATURES_HIERARCHY[type];
  if (bsda[signature.field]) {
    return false;
  }
  if (signature.next) {
    return isAwaitingSignature(signature.next, bsda);
  }
  return true;
}
