import { Form } from "@prisma/client";
import { RepositoryFnDeps } from "../types";

export type FindAppendix2FormsByIdFn = (id: string) => Promise<Form[]>;

const buildFindAppendix2FormsById: (
  deps: RepositoryFnDeps
) => FindAppendix2FormsByIdFn =
  ({ prisma }) =>
  id => {
    return prisma.form.findUnique({ where: { id } }).appendix2Forms();
  };

export default buildFindAppendix2FormsById;
