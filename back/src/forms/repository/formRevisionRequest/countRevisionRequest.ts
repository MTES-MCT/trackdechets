import { Prisma } from "@prisma/client";
import { RepositoryFnDeps } from "../types";

export type CountRevisionRequestsFn = (
  where: Prisma.BsddRevisionRequestWhereInput
) => Promise<number>;

const buildCountRevisionRequests: (
  deps: RepositoryFnDeps
) => CountRevisionRequestsFn =
  ({ prisma }) =>
  where => {
    return prisma.bsddRevisionRequest.count({ where });
  };

export default buildCountRevisionRequests;
