import { importOptions } from "@td/registry";
import { MutationAddToSsdRegistryArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { genericAddToRegistry } from "./genericAddToRegistry";

export async function addToSsdRegistry(
  _,
  { lines }: MutationAddToSsdRegistryArgs,
  context: GraphQLContext
) {
  return genericAddToRegistry(importOptions.SSD, lines, context);
}
