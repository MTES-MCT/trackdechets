import { Form } from "@prisma/client";
import { RepositoryFnDeps } from "../types";

export type FindAppendix2FormsByIdFn = (id: string) => Promise<Form[]>;

const buildFindAppendix2FormsById: (
  deps: RepositoryFnDeps
) => FindAppendix2FormsByIdFn =
  ({ prisma }) =>
  async id => {
    const grouping = await prisma.form
      .findUnique({ where: { id } })
      .grouping({ include: { initialForm: true } });
    return grouping.map(g => g.initialForm);
  };

export default buildFindAppendix2FormsById;
