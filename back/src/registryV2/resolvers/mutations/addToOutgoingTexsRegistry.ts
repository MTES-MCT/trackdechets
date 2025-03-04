import type { MutationAddToOutgoingTexsRegistryArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { genericAddToRegistry } from "./genericAddToRegistry";

export async function addToOutgoingTexsRegistry(
  _,
  { lines }: MutationAddToOutgoingTexsRegistryArgs,
  context: GraphQLContext
) {
  return genericAddToRegistry("OUTGOING_TEXS", lines, context);
}
