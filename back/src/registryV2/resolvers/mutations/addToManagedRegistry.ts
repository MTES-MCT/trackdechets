import type { MutationAddToManagedRegistryArgs } from "@td/codegen-back";
import { importOptions } from "@td/registry";
import { GraphQLContext } from "../../../types";
import { genericAddToRegistry } from "./genericAddToRegistry";

export async function addToManagedRegistry(
  _,
  { lines }: MutationAddToManagedRegistryArgs,
  context: GraphQLContext
) {
  return genericAddToRegistry(importOptions.MANAGED, lines, context);
}
