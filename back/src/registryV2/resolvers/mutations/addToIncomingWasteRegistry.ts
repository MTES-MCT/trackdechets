import { importOptions } from "@td/registry";
import { MutationAddToIncomingWasteRegistryArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { genericAddToRegistry } from "./genericAddToRegistry";

export async function addToIncomingWasteRegistry(
  _,
  { lines }: MutationAddToIncomingWasteRegistryArgs,
  context: GraphQLContext
) {
  return genericAddToRegistry(importOptions.INCOMING_WASTE, lines, context);
}
