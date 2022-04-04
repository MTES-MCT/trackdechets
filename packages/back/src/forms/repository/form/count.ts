import { Prisma } from "@prisma/client";
import { RepositoryFnDeps } from "../types";

export type CountFormsFn = (where: Prisma.FormWhereInput) => Promise<number>;

const buildCountForms: (deps: RepositoryFnDeps) => CountFormsFn =
  ({ prisma }) =>
  where => {
    return prisma.form.count({ where });
  };

export default buildCountForms;
