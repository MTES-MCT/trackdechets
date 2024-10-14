import { Prisma, RegistryDelegation } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindFirstRegistryDelegationFn = (
  where: Prisma.RegistryDelegationWhereInput,
  options?: Omit<Prisma.RegistryDelegationFindFirstArgs, "where">
) => Promise<RegistryDelegation | null>;

const buildFindFirstRegistryDelegation: (
  deps: ReadRepositoryFnDeps
) => FindFirstRegistryDelegationFn =
  ({ prisma }) =>
  (where, options?) => {
    const input = { where, ...options };
    return prisma.registryDelegation.findFirst(input);
  };

export default buildFindFirstRegistryDelegation;
