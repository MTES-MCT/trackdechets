import { Bspaoh, User, BspaohStatus, BspaohTransporter } from "@td/prisma";
import { objectDiff } from "../../forms/workflow/diff";
import type { BspaohSignatureType } from "@td/codegen-back";

import { SIGNATURES_HIERARCHY } from "./constants";
import { UnparsedInputs } from "./index";
import { getUserCompanies } from "../../users/database";
import {
  flattenBspaohInput,
  flattenBspaohTransporterInput
} from "../converter";

/**
 * Computes an unparsed BSPAOH by merging the GQL input and
 * the currently persisted BSPAOH in the database
 */
export function getUnparsedBspaoh({
  input,
  persisted,
  isDraft
}: UnparsedInputs) {
  const flattenedInput = input ? flattenBspaohInput(input) : {};
  const flattenedTransporterInput = input
    ? flattenBspaohTransporterInput(input)
    : {};

  return {
    ...persisted,
    ...flattenedInput,
    ...flattenedTransporterInput,
    isDraft: isDraft ?? Boolean(persisted?.status === BspaohStatus.DRAFT)
  };
}
type BspaohCompanyIdentifiers = Partial<
  Pick<Bspaoh, "emitterCompanySiret" | "destinationCompanySiret"> &
    Pick<
      BspaohTransporter,
      "transporterCompanySiret" | "transporterCompanyVatNumber"
    >
>;
export async function getUserFunctions(
  user: User | undefined,
  unparsedBspaoh: BspaohCompanyIdentifiers
) {
  const companies = user ? await getUserCompanies(user.id) : [];
  const orgIds = companies.map(c => c.orgId);

  return {
    isEmitter:
      unparsedBspaoh.emitterCompanySiret != null &&
      orgIds.includes(unparsedBspaoh.emitterCompanySiret),
    isDestination:
      unparsedBspaoh.destinationCompanySiret != null &&
      orgIds.includes(unparsedBspaoh.destinationCompanySiret),
    isTransporter:
      (unparsedBspaoh.transporterCompanySiret != null &&
        orgIds.includes(unparsedBspaoh.transporterCompanySiret)) ||
      (unparsedBspaoh.transporterCompanyVatNumber != null &&
        orgIds.includes(unparsedBspaoh.transporterCompanyVatNumber))
  };
}

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

  const flatBspaohInput = flattenBspaohInput(input);
  const flatTransporterInput = input
    ? flattenBspaohTransporterInput(input)
    : {};
  const flatInput = { ...flatBspaohInput, ...flatTransporterInput };
  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = {
    ...Object.keys(flatInput).reduce((acc, field) => {
      return { ...acc, [field]: persisted[field] };
    }, {})
  };

  const diff = objectDiff(flatInput, compareTo);

  return Object.keys(diff);
}

/**
 * Gets all the signatures prior to the target signature in the signature hierarchy.
 */
export function getSignatureAncestors(
  targetSignature: BspaohSignatureType | undefined
): BspaohSignatureType[] {
  if (!targetSignature) return [];

  const parent = Object.entries(SIGNATURES_HIERARCHY).find(
    ([_, details]) => details.next === targetSignature
  )?.[0];

  return [
    targetSignature,
    ...getSignatureAncestors(parent as BspaohSignatureType)
  ];
}
