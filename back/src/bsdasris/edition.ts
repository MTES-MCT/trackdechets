import { Bsdasri, User } from "@prisma/client";
import { safeInput } from "../common/converter";
import { SealedFieldError } from "../common/errors";
import { getCachedUserSiretOrVat } from "../common/redis/users";
import { objectDiff } from "../forms/workflow/diff";
import { BsdasriInput, BsdasriSignatureType } from "../generated/graphql/types";
import { flattenBsdasriInput } from "./converter";
import { getReadonlyBsdasriRepository } from "./repository";

// Defines until which signature BSDA fields can be modified
// The test in edition.test.ts ensures that every possible key in BsdaInput
// has a corresponding edition rule
export const editionRules: { [key: string]: BsdasriSignatureType } = {
  wasteCode: "EMISSION",
  wasteAdr: "EMISSION",
  emitterCompanyName: "EMISSION",
  emitterCompanySiret: "EMISSION",
  emitterCompanyAddress: "EMISSION",
  emitterCompanyContact: "EMISSION",
  emitterCompanyPhone: "EMISSION",
  emitterCompanyMail: "EMISSION",
  emitterPickupSiteName: "EMISSION",
  emitterPickupSiteAddress: "EMISSION",
  emitterPickupSiteCity: "EMISSION",
  emitterPickupSitePostalCode: "EMISSION",
  emitterPickupSiteInfos: "EMISSION",
  emitterCustomInfo: "EMISSION",
  emitterWasteWeightValue: "EMISSION",
  emitterWasteWeightIsEstimate: "EMISSION",
  emitterWasteVolume: "EMISSION",
  emitterWastePackagings: "EMISSION",
  ecoOrganismeName: "EMISSION",
  ecoOrganismeSiret: "EMISSION",
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
  transporterCustomInfo: "TRANSPORT",
  transporterTransportPlates: "TRANSPORT",
  transporterTransportMode: "TRANSPORT",
  transporterTakenOverAt: "TRANSPORT",
  handedOverToRecipientAt: "RECEPTION",
  transporterWasteWeightValue: "TRANSPORT",
  transporterWasteWeightIsEstimate: "TRANSPORT",
  transporterAcceptationStatus: "TRANSPORT",
  transporterWasteRefusedWeightValue: "TRANSPORT",
  transporterWasteRefusalReason: "TRANSPORT",
  transporterWasteVolume: "TRANSPORT",
  transporterWastePackagings: "TRANSPORT",
  destinationCompanyName: "RECEPTION",
  destinationCompanySiret: "RECEPTION",
  destinationCompanyAddress: "RECEPTION",
  destinationCompanyContact: "RECEPTION",
  destinationCompanyPhone: "RECEPTION",
  destinationCompanyMail: "RECEPTION",
  destinationCustomInfo: "RECEPTION",
  destinationReceptionWasteVolume: "RECEPTION",
  destinationReceptionAcceptationStatus: "RECEPTION",
  destinationReceptionDate: "RECEPTION",
  destinationReceptionWasteRefusedWeightValue: "RECEPTION",
  destinationReceptionWasteRefusalReason: "RECEPTION",
  destinationWastePackagings: "RECEPTION",
  destinationOperationCode: "OPERATION",
  destinationReceptionWasteWeightValue: "OPERATION",
  destinationOperationDate: "OPERATION",
  identificationNumbers: "RECEPTION",
  grouping: "EMISSION",
  synthesizing: "EMISSION"
};

// Normally all fields are editable when status is INITIAL
// On BSDASRI of type SYNTHESIS though, some fields are sealed from the beginning
// because they are computed from the different initial BSDASRIs data
const synthesisBlackList = [
  "emitterCompanyName",
  "emitterCompanySiret",
  "emitterPickupSiteName",
  "emitterPickupSiteAddress",
  "emitterPickupSiteCity",
  "emitterPickupSitePostalCode",
  "emitterPickupSiteInfos",
  "emitterCustomInfo",
  "emitterWasteWeightValue",
  "emitterWasteWeightIsEstimate",
  "ecoOrganismeName",
  "ecoOrganismeSiret",
  "transporterCompanySiret",
  "transporterCompanyVatNumber",
  "transporterWastePackagings",
  "transporterWasteVolume"
];

export async function checkEditionRules(
  bsdasri: Bsdasri,
  input: BsdasriInput,
  user?: User
) {
  const sealedFieldErrors: string[] = [];

  const updatedFields = await getUpdatedFields(bsdasri, input);

  if (bsdasri.status === "INITIAL") {
    if (bsdasri.type === "SYNTHESIS") {
      for (const field of updatedFields) {
        if (synthesisBlackList.includes(field)) {
          sealedFieldErrors.push(field);
        }
      }
    } else {
      return true;
    }
  }

  const userSirets = user?.id ? await getCachedUserSiretOrVat(user.id) : [];
  const isEmitter = userSirets.includes(bsdasri.emitterCompanySiret);

  // Inner function used to recursively checks that the diff
  // does not contain any fields sealed by signature
  function checkSealedFields(
    signatureType: BsdasriSignatureType,
    editableFields: string[]
  ) {
    if (signatureType === null) {
      return checkSealedFields(
        "EMISSION",
        editableFields.filter(field => editionRules[field] !== "EMISSION")
      );
    }

    if (
      isAwaitingSignature(signatureType, bsdasri) ||
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
  existingBsda: Bsdasri,
  input: BsdasriInput
): Promise<string[]> {
  const updatedFields = [];

  const flatInput = safeInput({
    ...flattenBsdasriInput(input),
    grouping: input.grouping,
    synthesizing: input.synthesizing
  });

  const { ...bsdasri } = existingBsda;
  const { findRelatedEntity } = getReadonlyBsdasriRepository();
  const grouping = await findRelatedEntity({ id: bsdasri.id }).grouping();
  const synthesizing = await findRelatedEntity({
    id: bsdasri.id
  }).synthesizing();

  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = {
    ...Object.keys(flatInput).reduce((acc, field) => {
      return { ...acc, [field]: bsdasri[field] };
    }, {}),
    ...(input.grouping ? { grouping: grouping?.map(g => g.id) } : {}),
    ...(input.synthesizing
      ? { synthesizing: synthesizing?.map(g => g.id) }
      : {})
  };

  const diff = objectDiff(flatInput, compareTo);

  for (const field of Object.keys(diff)) {
    updatedFields.push(field);
  }

  return updatedFields;
}

const SIGNATURES_HIERARCHY: {
  [key in BsdasriSignatureType]: {
    field: keyof Bsdasri;
    next?: BsdasriSignatureType;
  };
} = {
  EMISSION: { field: "emitterEmissionSignatureDate", next: "TRANSPORT" },
  TRANSPORT: {
    field: "transporterTransportSignatureDate",
    next: "RECEPTION"
  },
  RECEPTION: { field: "destinationReceptionSignatureDate", next: "OPERATION" },
  OPERATION: { field: "destinationOperationSignatureDate" }
};

/**
 * Checks if the BSDASRI is awaiting a specific signature type
 * Some signatures may be skipped in some situation so we need to checks recursively in
 * the signature hierarchy.
 */
export function isAwaitingSignature(type: BsdasriSignatureType, bsda: Bsdasri) {
  const signature = SIGNATURES_HIERARCHY[type];
  if (bsda[signature.field]) {
    return false;
  }
  if (signature.next) {
    return isAwaitingSignature(signature.next, bsda);
  }
  return true;
}
