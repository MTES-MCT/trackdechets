import { User } from "@prisma/client";
import { objectDiff } from "../../forms/workflow/diff";
import { BsdaSignatureType } from "../../generated/graphql/types";
import { flattenBsdaInput, flattenBsdaTransporterInput } from "../converter";
import { SIGNATURES_HIERARCHY } from "./constants";
import { UnparsedInputs } from "./index";
import { getUserCompanies } from "../../users/database";
import { getFirstTransporterSync } from "../database";
import { ZodBsda } from "./schema";

/**
 * Computes an unparsed BSDA by merging the GQL input and
 * the currently persisted BSDA in the database
 */
export function getUnparsedBsda({ input, persisted, isDraft }: UnparsedInputs) {
  const flattenedInput = input ? flattenBsdaInput(input) : null;

  const { transporters, ...persistedData } = persisted ?? {};

  const transporter = {
    ...transporters?.[0],
    ...(input ? flattenBsdaTransporterInput(input) : {})
  };

  return {
    ...persistedData,
    ...flattenedInput,
    isDraft: isDraft ?? Boolean(persisted?.isDraft),
    intermediaries: input?.intermediaries ?? persisted?.intermediaries,
    grouping: input?.grouping ?? persisted?.grouping.map(bsda => bsda.id),
    forwarding: input?.forwarding ?? persisted?.forwarding?.id,
    ...transporter
  };
}

type UnparsedBsda = ReturnType<typeof getUnparsedBsda>;

/**
 * Computes all the fields that will be updated
 * If a field is present in the input but has the same value as the
 * data present in the DB, we do not return it as we want to
 * allow reposting fields if they are not modified
 */
export function getUpdatedFields({
  input,
  persisted
}: UnparsedInputs): string[] {
  if (!input || !persisted) {
    return [];
  }

  const flatInput = flattenBsdaInput(input);
  const flatTransporterInput = flattenBsdaTransporterInput(input);
  const persistedTransporter = getFirstTransporterSync(persisted);

  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = {
    ...Object.keys(flatInput).reduce((acc, field) => {
      return { ...acc, [field]: persisted[field] };
    }, {}),
    ...Object.keys(flatTransporterInput).reduce((acc, field) => {
      return { ...acc, [field]: persistedTransporter?.[field] };
    }, {}),
    ...(input.grouping ? { grouping: persisted.grouping?.map(g => g.id) } : {}),
    ...(input.forwarding ? { forwarding: persisted.forwarding?.id } : {}),
    ...(input.intermediaries
      ? {
          intermediaries: persisted.intermediaries?.map(inter => {
            const { bsdaId, id, createdAt, ...input } = inter; // To match the input, we remove some internal fields
            return input;
          })
        }
      : {})
  };

  const diff = objectDiff(flatInput, compareTo);

  return Object.keys(diff);
}

/**
 * Gets all the signatures prior to the target signature in the signature hierarchy.
 */
export function getSignatureAncestors(
  targetSignature: BsdaSignatureType | undefined
): BsdaSignatureType[] {
  if (!targetSignature) return [];

  const parent = Object.entries(SIGNATURES_HIERARCHY).find(
    ([_, details]) => details.next === targetSignature
  )?.[0];

  return [
    targetSignature,
    ...getSignatureAncestors(parent as BsdaSignatureType)
  ];
}

export async function getUserFunctions(
  user: User | undefined,
  unparsedBsda: UnparsedBsda
) {
  const companies = user ? await getUserCompanies(user.id) : [];
  const orgIds = companies.map(c => c.orgId);

  return {
    isEcoOrganisme:
      unparsedBsda.ecoOrganismeSiret != null &&
      orgIds.includes(unparsedBsda.ecoOrganismeSiret),
    isBroker:
      unparsedBsda.brokerCompanySiret != null &&
      orgIds.includes(unparsedBsda.brokerCompanySiret),
    isWorker:
      unparsedBsda.workerCompanySiret != null &&
      orgIds.includes(unparsedBsda.workerCompanySiret),
    isEmitter:
      unparsedBsda.emitterCompanySiret != null &&
      orgIds.includes(unparsedBsda.emitterCompanySiret),
    isDestination:
      unparsedBsda.destinationCompanySiret != null &&
      orgIds.includes(unparsedBsda.destinationCompanySiret),
    isTransporter:
      (unparsedBsda.transporterCompanySiret != null &&
        orgIds.includes(unparsedBsda.transporterCompanySiret)) ||
      (unparsedBsda.transporterCompanyVatNumber != null &&
        orgIds.includes(unparsedBsda.transporterCompanyVatNumber))
  };
}
