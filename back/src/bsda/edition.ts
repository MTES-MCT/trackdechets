import { Bsda, User } from "@prisma/client";
import { safeInput } from "../common/converter";
import { SealedFieldError } from "../common/errors";
import { getCachedUserSiretOrVat } from "../common/redis/users";
import { objectDiff } from "../forms/workflow/diff";
import { BsdaInput, BsdaSignatureType } from "../generated/graphql/types";
import { flattenBsdaInput } from "./converter";
import { getReadonlyBsdaRepository } from "./repository";

// Defines until which signature BSDA fields can be modified
// The test in edition.test.ts ensures that every possible key in BsdaInput
// has a corresponding edition rule
export const editionRules: { [key: string]: BsdaSignatureType } = {
  type: "EMISSION",
  emitterIsPrivateIndividual: "EMISSION",
  emitterCompanyName: "EMISSION",
  emitterCompanySiret: "EMISSION",
  emitterCompanyAddress: "EMISSION",
  emitterCompanyContact: "EMISSION",
  emitterCompanyPhone: "EMISSION",
  emitterCompanyMail: "EMISSION",
  emitterCustomInfo: "EMISSION",
  emitterPickupSiteName: "EMISSION",
  emitterPickupSiteAddress: "EMISSION",
  emitterPickupSiteCity: "EMISSION",
  emitterPickupSitePostalCode: "EMISSION",
  emitterPickupSiteInfos: "EMISSION",
  ecoOrganismeName: "TRANSPORT",
  ecoOrganismeSiret: "TRANSPORT",
  destinationCompanyName: "EMISSION",
  destinationCompanySiret: "EMISSION",
  destinationCompanyAddress: "EMISSION",
  destinationCompanyContact: "EMISSION",
  destinationCompanyPhone: "EMISSION",
  destinationCompanyMail: "EMISSION",
  destinationCustomInfo: "OPERATION",
  destinationCap: "EMISSION",
  destinationPlannedOperationCode: "EMISSION",
  destinationReceptionDate: "OPERATION",
  destinationReceptionWeight: "OPERATION",
  destinationReceptionAcceptationStatus: "OPERATION",
  destinationReceptionRefusalReason: "OPERATION",
  destinationOperationCode: "OPERATION",
  destinationOperationDescription: "OPERATION",
  destinationOperationDate: "OPERATION",
  destinationOperationNextDestinationCompanyName: "OPERATION",
  destinationOperationNextDestinationCompanySiret: "OPERATION",
  destinationOperationNextDestinationCompanyVatNumber: "OPERATION",
  destinationOperationNextDestinationCompanyAddress: "OPERATION",
  destinationOperationNextDestinationCompanyContact: "OPERATION",
  destinationOperationNextDestinationCompanyPhone: "OPERATION",
  destinationOperationNextDestinationCompanyMail: "OPERATION",
  destinationOperationNextDestinationCap: "OPERATION",
  destinationOperationNextDestinationPlannedOperationCode: "OPERATION",
  transporterCompanyName: "TRANSPORT",
  transporterCompanySiret: "TRANSPORT",
  transporterCompanyAddress: "TRANSPORT",
  transporterCompanyContact: "TRANSPORT",
  transporterCompanyPhone: "TRANSPORT",
  transporterCompanyMail: "TRANSPORT",
  transporterCompanyVatNumber: "TRANSPORT",
  transporterCustomInfo: "TRANSPORT",
  transporterRecepisseIsExempted: "TRANSPORT",
  transporterRecepisseNumber: "TRANSPORT",
  transporterRecepisseDepartment: "TRANSPORT",
  transporterRecepisseValidityLimit: "TRANSPORT",
  transporterTransportMode: "TRANSPORT",
  transporterTransportPlates: "TRANSPORT",
  transporterTransportTakenOverAt: "TRANSPORT",
  workerIsDisabled: "EMISSION",
  workerCompanyName: "EMISSION",
  workerCompanySiret: "EMISSION",
  workerCompanyAddress: "EMISSION",
  workerCompanyContact: "EMISSION",
  workerCompanyPhone: "EMISSION",
  workerCompanyMail: "EMISSION",
  workerWorkHasEmitterPaperSignature: "WORK",
  workerCertificationHasSubSectionFour: "WORK",
  workerCertificationHasSubSectionThree: "WORK",
  workerCertificationCertificationNumber: "WORK",
  workerCertificationValidityLimit: "WORK",
  workerCertificationOrganisation: "WORK",
  brokerCompanyName: "EMISSION",
  brokerCompanySiret: "EMISSION",
  brokerCompanyAddress: "EMISSION",
  brokerCompanyContact: "EMISSION",
  brokerCompanyPhone: "EMISSION",
  brokerCompanyMail: "EMISSION",
  brokerRecepisseNumber: "EMISSION",
  brokerRecepisseDepartment: "EMISSION",
  brokerRecepisseValidityLimit: "EMISSION",
  wasteCode: "EMISSION",
  wasteAdr: "WORK",
  wasteFamilyCode: "WORK",
  wasteMaterialName: "WORK",
  wasteConsistence: "WORK",
  wasteSealNumbers: "WORK",
  wastePop: "WORK",
  packagings: "WORK",
  weightIsEstimate: "WORK",
  weightValue: "WORK",
  grouping: "EMISSION",
  forwarding: "EMISSION",
  intermediaries: "TRANSPORT"
};

export async function checkEditionRules(
  bsda: Bsda,
  input: BsdaInput,
  user?: User
) {
  if (bsda.status === "INITIAL") {
    return true;
  }

  const userSirets = user?.id ? await getCachedUserSiretOrVat(user.id) : [];
  const isEmitter = userSirets.includes(bsda.emitterCompanySiret);

  if (bsda.status === "SIGNED_BY_PRODUCER" && isEmitter) {
    return true;
  }

  const sealedFieldErrors: string[] = [];

  const updatedFields = await getUpdatedFields(bsda, input);

  // Inner function used to recursively checks that the diff
  // does not contain any fields sealed by signature
  function checkSealedFields(
    signatureType: BsdaSignatureType,
    editableFields: string[]
  ) {
    if (signatureType === null) {
      return checkSealedFields(
        "EMISSION",
        editableFields.filter(field => editionRules[field] !== "EMISSION")
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
  bsda: Bsda,
  input: BsdaInput
): Promise<string[]> {
  const updatedFields = [];

  const flatInput = safeInput({
    ...flattenBsdaInput(input),
    grouping: input.grouping,
    forwarding: input.forwarding,
    intermediaries: input.intermediaries
  });

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
    ...(input.forwarding ? { forwarding: forwarding.id } : {}),
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

  for (const field of Object.keys(diff)) {
    updatedFields.push(field);
  }

  return updatedFields;
}

const SIGNATURES_HIERARCHY: {
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
