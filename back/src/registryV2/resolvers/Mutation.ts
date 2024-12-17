import type { MutationResolvers } from "@td/codegen-back";
import { generateRegistryV2Export } from "./mutations/generateRegistryV2Export";
export const Mutation: MutationResolvers = {
  generateRegistryV2Export: generateRegistryV2Export as any
};
