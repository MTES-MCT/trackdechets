import { Form } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindGroupedFormsByIdFn = (id: string) => Promise<Form[]>;

const buildFindGroupedFormsById: (
  deps: ReadRepositoryFnDeps
) => FindGroupedFormsByIdFn =
  ({ prisma }) =>
  async id => {
    const grouping = await prisma.form
      .findUnique({ where: { id } })
      .grouping({ include: { initialForm: true } });

    if (!grouping) {
      return [];
    }

    return grouping.map(g => g.initialForm);
  };

export default buildFindGroupedFormsById;
