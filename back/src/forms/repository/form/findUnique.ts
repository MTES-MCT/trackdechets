import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindUniqueFormFn = <Args extends Prisma.FormArgs>(
  where: Prisma.FormWhereUniqueInput,
  options?: Omit<Prisma.FormFindUniqueArgs, "where">
) => Promise<Prisma.FormGetPayload<Args>>;

const buildFindUniqueForm: (deps: ReadRepositoryFnDeps) => FindUniqueFormFn =
  ({ prisma }) =>
  async <Args>(where, options?) => {
    const input = { where, ...options };
    const bsdd = await prisma.form.findUnique(input);
    return bsdd as Prisma.FormGetPayload<Args>;
  };

export default buildFindUniqueForm;
