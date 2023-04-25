import { Form } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindForwardedInByIdFn = (id: string) => Promise<Form | null>;

const buildFindForwardedInById: (
  deps: ReadRepositoryFnDeps
) => FindForwardedInByIdFn =
  ({ prisma }) =>
  id => {
    return prisma.form.findUnique({ where: { id } }).forwardedIn();
  };

export default buildFindForwardedInById;
