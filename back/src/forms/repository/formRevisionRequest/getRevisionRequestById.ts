import { BsddRevisionRequest, Prisma } from "@prisma/client";
import { RepositoryFnDeps } from "../types";

export type GetRevisionRequestByIdFn = (
  id: string,
  options?: Omit<Prisma.BsddRevisionRequestFindUniqueArgs, "where">
) => Promise<BsddRevisionRequest>;

const buildGetRevisionRequestById: (
  deps: RepositoryFnDeps
) => GetRevisionRequestByIdFn =
  ({ prisma }) =>
  async (id, options) => {
    return prisma.bsddRevisionRequest.findUnique({
      where: { id },
      ...options
    });
  };

export default buildGetRevisionRequestById;
