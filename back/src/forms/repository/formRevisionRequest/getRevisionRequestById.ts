import { BsddRevisionRequest, Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type GetRevisionRequestByIdFn = (
  id: string,
  options?: Omit<Prisma.BsddRevisionRequestFindUniqueArgs, "where">
) => Promise<BsddRevisionRequest | null>;

const buildGetRevisionRequestById: (
  deps: ReadRepositoryFnDeps
) => GetRevisionRequestByIdFn =
  ({ prisma }) =>
  async (id, options) => {
    return prisma.bsddRevisionRequest.findUnique({
      where: { id },
      ...options
    });
  };

export default buildGetRevisionRequestById;
