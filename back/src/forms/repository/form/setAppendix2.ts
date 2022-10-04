import { Form } from "@prisma/client";
import { RepositoryFnDeps } from "../../../common/repository/types";
import buildUpdateAppendix2Forms from "./updateAppendix2Forms";

class FormFraction {
  form: Form;
  quantity: number;
}

class SetAppendix2Args {
  form: Form;
  appendix2: FormFraction[] | null;
  currentAppendix2Forms?: Form[];
}

export type SetAppendix2Fn = (args: SetAppendix2Args) => Promise<void>;

/**
 * Set appendix2 on a groupement form by creating associations between
 * the groupement form and the initial forms in the intermdediary table
 * FormGroupement.
 *
 * - Previous associations not specified in the input should be discarded
 * - If a form was already part of the appendix2, the quantity of the association
 * should be updated
 *
 * This function should also recompute the status (AWAITING_GROUP or GROUPED) of the initial
 * forms and the value of the field `quantityGrouped`.
 *
 * A form is considered GROUPED if its total quantity has been affected and if all
 * its groupement forms are SEALED
 *
 * The function should also prevent affecting more quantity of an initial form
 * than that has been received at the TTR site.
 */
const buildSetAppendix2: (deps: RepositoryFnDeps) => SetAppendix2Fn =
  ({ prisma, user }) =>
  async ({ form, appendix2, currentAppendix2Forms }) => {
    // delete existing appendix2 not present in input
    await prisma.formGroupement.deleteMany({
      where: {
        nextFormId: form.id,
        initialFormId: { notIn: appendix2.map(({ form }) => form.id) }
      }
    });

    // update or create new appendix2
    await Promise.all(
      appendix2.map(({ form: initialForm, quantity }) => {
        if (currentAppendix2Forms.map(f => f.id).includes(initialForm.id)) {
          // update existing appendix2
          return prisma.formGroupement.updateMany({
            where: {
              nextFormId: form.id,
              initialFormId: initialForm.id
            },
            data: { quantity: quantity }
          });
        } else {
          // create appendix2
          return prisma.formGroupement.create({
            data: {
              nextFormId: form.id,
              initialFormId: initialForm.id,
              quantity: quantity
            }
          });
        }
      })
    );

    const dirtyFormIds = [
      ...new Set([
        ...currentAppendix2Forms.map(f => f.id),
        ...appendix2.map(({ form }) => form.id)
      ])
    ];

    const dirtyForms = await prisma.form.findMany({
      where: { id: { in: dirtyFormIds } }
    });

    const updateAppendix2Forms = buildUpdateAppendix2Forms({ prisma, user });
    await updateAppendix2Forms(dirtyForms);
  };

export default buildSetAppendix2;
