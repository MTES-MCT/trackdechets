import { Form } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";
import { FormWithForwardedIn } from "../../types";

export type FindGroupedFormsByIdFn = (
  id: string
) => Promise<Array<Form & FormWithForwardedIn>>;

const buildFindGroupedFormsById: (
  deps: ReadRepositoryFnDeps
) => FindGroupedFormsByIdFn =
  ({ prisma }) =>
  async id => {
    const grouping = await prisma.form.findUnique({ where: { id } }).grouping({
      include: { initialForm: { include: { forwardedIn: true } } }
    });

    if (!grouping) {
      return [];
    }

    return grouping.map(g => g.initialForm);
  };

export default buildFindGroupedFormsById;
