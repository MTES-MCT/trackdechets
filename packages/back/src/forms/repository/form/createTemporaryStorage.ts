import { Prisma, TemporaryStorageDetail } from "@prisma/client";
import { RepositoryFnDeps } from "../types";

export type CreateTemporaryStorageFn = (
  data: Prisma.TemporaryStorageDetailCreateInput
) => Promise<TemporaryStorageDetail>;

const buildCreateTemporaryStorage: (
  deps: RepositoryFnDeps
) => CreateTemporaryStorageFn =
  ({ prisma }) =>
  data => {
    return prisma.temporaryStorageDetail.create({
      data
    });
  };

export default buildCreateTemporaryStorage;
