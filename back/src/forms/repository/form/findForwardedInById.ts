import { Form } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../types";

export type FindForwardedInByIdFn = (id: string) => Promise<Form>;

const buildFindForwardedInById: (
  deps: ReadRepositoryFnDeps
) => FindForwardedInByIdFn =
  ({ prisma }) =>
  id => {
    return prisma.form.findUnique({ where: { id } }).forwardedIn();
  };

export default buildFindForwardedInById;
