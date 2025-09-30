import { Prisma, AdminRequest } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindFirstAdminRequestFn = (
  where: Prisma.AdminRequestWhereInput,
  options?: Omit<Prisma.AdminRequestFindFirstArgs, "where">
) => Promise<AdminRequest | null>;

const buildFindFirstAdminRequest: (
  deps: ReadRepositoryFnDeps
) => FindFirstAdminRequestFn =
  ({ prisma }) =>
  (where, options?) => {
    const input = { where, ...options };
    return prisma.adminRequest.findFirst(input);
  };

export default buildFindFirstAdminRequest;
