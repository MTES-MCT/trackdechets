import { Form, Prisma } from "@prisma/client";
import { RepositoryFnDeps } from "../types";

export type FindUniqueFormFn = (
  where: Prisma.FormWhereUniqueInput,
  options?: Omit<Prisma.FormFindUniqueArgs, "where">
) => Promise<Form>;

const buildFindUniqueForm: (deps: RepositoryFnDeps) => FindUniqueFormFn =
  ({ prisma }) =>
  (where, options?) => {
    const input = { where, ...options };
    return prisma.form.findUnique(input);
  };

export default buildFindUniqueForm;
