import { Form } from "@prisma/client";
import { RepositoryFnDeps } from "../types";

export type FindForwardedInByIdFn = (id: string) => Promise<Form>;

const buildFindForwardedInById: (
  deps: RepositoryFnDeps
) => FindForwardedInByIdFn =
  ({ prisma }) =>
  id => {
    return prisma.form.findUnique({ where: { id } }).forwardedIn();
  };

export default buildFindForwardedInById;
