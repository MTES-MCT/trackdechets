import { Form } from "@prisma/client";
import { RepositoryFnDeps } from "../types";
import buildFindAppendix2FormsById from "./findAppendix2FormsById";
import buildFindUniqueForm from "./findUnique";
import buildUpdateManyForms from "./updateMany";

export type RemoveAppendix2Fn = (id: string) => Promise<Form>;

const buildRemoveAppendix2: (deps: RepositoryFnDeps) => RemoveAppendix2Fn =
  ({ prisma, user }) =>
  async id => {
    const findAppendix2FormsById = buildFindAppendix2FormsById({
      prisma,
      user
    });
    const appendix2Forms = await findAppendix2FormsById(id);

    if (appendix2Forms.length) {
      const updateManyForms = buildUpdateManyForms({ prisma, user });
      // disconnect appendix2
      await prisma.formGroupement.deleteMany({ where: { nextFormId: id } });

      // roll back status
      await updateManyForms(
        appendix2Forms.map(f => f.id),
        { status: "AWAITING_GROUP" }
      );
    }

    const findUniqueForm = buildFindUniqueForm({ prisma, user });
    return findUniqueForm({ id });
  };

export default buildRemoveAppendix2;
