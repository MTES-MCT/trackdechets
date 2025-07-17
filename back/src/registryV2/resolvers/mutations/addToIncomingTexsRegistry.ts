import { MutationAddToIncomingTexsRegistryArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { genericAddToRegistry } from "./genericAddToRegistry";

export async function addToIncomingTexsRegistry(
  _,
  { lines }: MutationAddToIncomingTexsRegistryArgs,
  context: GraphQLContext
) {
  return genericAddToRegistry("INCOMING_TEXS", lines, context);
}
