import { Form, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../types";

export type FindUniqueFormFn = (
  where: Prisma.FormWhereUniqueInput,
  options?: Omit<Prisma.FormFindUniqueArgs, "where">
) => Promise<Form>;

const buildFindUniqueForm: (deps: ReadRepositoryFnDeps) => FindUniqueFormFn =
  ({ prisma }) =>
  (where, options?) => {
    const input = { where, ...options };
    return prisma.form.findUnique(input);
  };

export default buildFindUniqueForm;
