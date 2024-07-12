import { SignatureTypeInput } from "../../generated/graphql/types";
import { BSVHU_SIGNATURES_HIERARCHY } from "./constants";

/**
 * Gets all the signatures prior to the target signature in the signature hierarchy.
 */
export function getSignatureAncestors(
  targetSignature: SignatureTypeInput | undefined | null
): SignatureTypeInput[] {
  if (!targetSignature) return [];

  const parent = Object.entries(BSVHU_SIGNATURES_HIERARCHY).find(
    ([_, details]) => details.next === targetSignature
  )?.[0];

  return [
    targetSignature,
    ...getSignatureAncestors(parent as SignatureTypeInput)
  ];
}
