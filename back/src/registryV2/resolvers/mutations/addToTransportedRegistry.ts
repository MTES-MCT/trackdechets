import type { MutationAddToTransportedRegistryArgs } from "@td/codegen-back";
import { importOptions } from "@td/registry";
import { GraphQLContext } from "../../../types";
import { genericAddToRegistry } from "./genericAddToRegistry";

export async function addToTransportedRegistry(
  _,
  { lines }: MutationAddToTransportedRegistryArgs,
  context: GraphQLContext
) {
  return genericAddToRegistry(importOptions.TRANSPORTED, lines, context);
}
