import { Form } from "@prisma/client";
import { RepositoryFnDeps } from "../../../common/repository/types";
import buildUpdateAppendix2Forms, {
  FormForUpdateAppendix2FormsInclude
} from "./updateAppendix2Forms";

class FormFraction {
  form: Form;
  quantity: number;
}

class SetAppendix2Args {
  form: Form;
  appendix2: FormFraction[];
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
    const formGroupementToCreate: {
      nextFormId: string;
      initialFormId: string;
      quantity: number;
    }[] = [];
    const formGroupementToUpdate: {
      initialFormId: string;
      quantity: number;
    }[] = [];

    for (const { form: initialForm, quantity } of appendix2) {
      if (
        currentAppendix2Forms &&
        currentAppendix2Forms.map(f => f.id).includes(initialForm.id)
      ) {
        formGroupementToUpdate.push({
          initialFormId: initialForm.id,
          quantity
        });
      } else {
        formGroupementToCreate.push({
          nextFormId: form.id,
          initialFormId: initialForm.id,
          quantity: quantity
        });
      }
    }

    if (formGroupementToCreate.length > 0) {
      await prisma.formGroupement.createMany({
        data: formGroupementToCreate
      });
    }
    if (formGroupementToUpdate.length > 0) {
      // We compare existing groupements with the updates. If the quantity hasn't changed, we skip the update
      const existingGroupements = await prisma.formGroupement.findMany({
        where: {
          nextFormId: form.id
        }
      });
      const validUpdates = formGroupementToUpdate.filter(update => {
        const existingGroupement = existingGroupements.find(
          grp => grp.initialFormId === update.initialFormId
        );
        return existingGroupement?.quantity !== update.quantity;
      });

      await Promise.all(
        validUpdates.map(({ initialFormId, quantity }) =>
          prisma.formGroupement.updateMany({
            where: {
              nextFormId: form.id,
              initialFormId
            },
            data: { quantity }
          })
        )
      );
    }

    const dirtyFormIds = [
      ...new Set([
        ...(currentAppendix2Forms?.map(f => f.id) ?? []),
        ...appendix2.map(({ form }) => form.id)
      ])
    ];

    const dirtyForms = await prisma.form.findMany({
      where: { id: { in: dirtyFormIds } },
      include: FormForUpdateAppendix2FormsInclude
    });

    const updateAppendix2Forms = buildUpdateAppendix2Forms({ prisma, user });
    await updateAppendix2Forms(dirtyForms);
  };

export default buildSetAppendix2;
