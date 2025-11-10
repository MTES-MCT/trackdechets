import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountRevisionRequestsFn = (
  where: Prisma.BsddRevisionRequestWhereInput
) => Promise<number>;

const buildCountRevisionRequests: (
  deps: ReadRepositoryFnDeps
) => CountRevisionRequestsFn =
  ({ prisma }) =>
  where => {
    return prisma.bsddRevisionRequest.count({ where });
  };

export default buildCountRevisionRequests;
