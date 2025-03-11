import type { MutationAddToTransportedRegistryArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { genericAddToRegistry } from "./genericAddToRegistry";

export async function addToTransportedRegistry(
  _,
  { lines }: MutationAddToTransportedRegistryArgs,
  context: GraphQLContext
) {
  return genericAddToRegistry("TRANSPORTED", lines, context);
}
