import type { MutationAddToOutgoingWasteRegistryArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { genericAddToRegistry } from "./genericAddToRegistry";

export async function addToOutgoingWasteRegistry(
  _,
  { lines }: MutationAddToOutgoingWasteRegistryArgs,
  context: GraphQLContext
) {
  return genericAddToRegistry("OUTGOING_WASTE", lines, context);
}
