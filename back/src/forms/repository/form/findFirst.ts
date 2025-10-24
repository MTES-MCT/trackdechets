import { Form, Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindFirstFormFn = (
  where: Prisma.FormWhereInput,
  options?: Omit<Prisma.FormFindFirstArgs, "where">
) => Promise<Form | null>;

const buildFindFirstForm: (deps: ReadRepositoryFnDeps) => FindFirstFormFn =
  ({ prisma }) =>
  (where, options?) => {
    const input = { where, ...options };
    return prisma.form.findFirst(input);
  };

export default buildFindFirstForm;
