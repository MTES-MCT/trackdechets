import type { MutationAddToOutgoingWasteRegistryArgs } from "@td/codegen-back";
import { importOptions } from "@td/registry";
import { GraphQLContext } from "../../../types";
import { genericAddToRegistry } from "./genericAddToRegistry";

export async function addToOutgoingWasteRegistry(
  _,
  { lines }: MutationAddToOutgoingWasteRegistryArgs,
  context: GraphQLContext
) {
  return genericAddToRegistry(importOptions.OUTGOING_WASTE, lines, context);
}
