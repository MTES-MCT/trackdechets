import { Prisma } from "@prisma/client";
import { RepositoryFnDeps } from "../types";

export type CountFormFn = (where: Prisma.FormWhereInput) => Promise<number>;

const buildCountForms: (deps: RepositoryFnDeps) => CountFormFn =
  ({ prisma }) =>
  where => {
    return prisma.form.count({ where });
  };

export default buildCountForms;
