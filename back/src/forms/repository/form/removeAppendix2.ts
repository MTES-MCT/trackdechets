import { Form } from "@prisma/client";
import { RepositoryFnDeps } from "../types";
import buildUpdateForm from "./update";
import buildUpdateManyForms from "./updateMany";

export type RemoveAppendix2Fn = (id: string) => Promise<Form>;

const buildRemoveAppendix2: (deps: RepositoryFnDeps) => RemoveAppendix2Fn =
  ({ prisma, user }) =>
  async id => {
    const appendix2Forms = await prisma.form
      .findUnique({ where: { id } })
      .appendix2Forms();
    const updateForm = buildUpdateForm({ prisma, user });
    const updateManyForms = buildUpdateManyForms({ prisma, user });
    // disconnect appendix2
    const updatedForm = await updateForm(
      { id },
      { appendix2Forms: { set: [] } }
    );
    // roll back status
    await updateManyForms(
      appendix2Forms.map(f => f.id),
      { status: "AWAITING_GROUP" }
    );
    return updatedForm;
  };

export default buildRemoveAppendix2;
