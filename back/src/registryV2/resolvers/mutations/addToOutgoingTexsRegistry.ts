import type { MutationAddToOutgoingTexsRegistryArgs } from "@td/codegen-back";
import { importOptions } from "@td/registry";
import { GraphQLContext } from "../../../types";
import { genericAddToRegistry } from "./genericAddToRegistry";

export async function addToOutgoingTexsRegistry(
  _,
  { lines }: MutationAddToOutgoingTexsRegistryArgs,
  context: GraphQLContext
) {
  return genericAddToRegistry(importOptions.OUTGOING_TEXS, lines, context);
}
