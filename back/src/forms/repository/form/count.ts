import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountFormsFn = (where: Prisma.FormWhereInput) => Promise<number>;

const buildCountForms: (deps: ReadRepositoryFnDeps) => CountFormsFn =
  ({ prisma }) =>
  where => {
    return prisma.form.count({ where });
  };

export default buildCountForms;
