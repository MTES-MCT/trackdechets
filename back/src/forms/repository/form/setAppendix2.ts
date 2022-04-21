import { Form, Status } from "@prisma/client";
import { UserInputError } from "apollo-server-core";
import { RepositoryFnDeps } from "../types";
import buildFindAppendix2FormsById from "./findAppendix2FormsById";

class FormFraction {
  form: Form;
  quantity: number;
}

class SetAppendix2Args {
  form: Form;
  initialForms: FormFraction[];
}

export type SetAppendix2Fn = (args: SetAppendix2Args) => Promise<Form[]>;

const buildSetAppendix2: (deps: RepositoryFnDeps) => SetAppendix2Fn =
  ({ prisma, user }) =>
  async ({ form, initialForms }) => {
    const findAppendix2FormsById = buildFindAppendix2FormsById({
      prisma,
      user
    });

    const currentAppendix2Forms = await findAppendix2FormsById(form.id);

    // delete existing appendix2 not present in input
    const formsToUngroup = currentAppendix2Forms.filter(
      f => !initialForms.map(({ form }) => form.id).includes(f.id)
    );

    await prisma.formGroupement.deleteMany({
      where: {
        initialFormId: { in: formsToUngroup.map(f => f.id) },
        nextFormId: form.id
      }
    });
    // make sure to reset status to AWAITING_GROUP
    await prisma.form.updateMany({
      where: {
        status: Status.GROUPED,
        id: { in: formsToUngroup.map(f => f.id) }
      },
      data: { status: Status.AWAITING_GROUP }
    });

    // update or create new appendix2
    for (const initialFormFraction of initialForms) {
      // make sure total quantity is not greater than quantity received, or throw an exception
      const aggregate = await prisma.formGroupement.aggregate({
        _sum: { quantity: true },
        where: {
          initialFormId: initialFormFraction.form.id,
          nextFormId: { not: form.id }
        }
      });

      if (
        aggregate._sum.quantity + initialFormFraction.quantity >
        initialFormFraction.form.quantityReceived
      ) {
        const availableQuantity =
          initialFormFraction.form.quantityReceived - aggregate._sum.quantity;
        throw new UserInputError(
          `La quantité restante à regrouper sur le BSDD ${initialFormFraction.form.readableId} est de ${availableQuantity}.
          Vous tentez de regrouper ${initialFormFraction.quantity}.`
        );
      }

      if (
        currentAppendix2Forms
          .map(f => f.id)
          .includes(initialFormFraction.form.id)
      ) {
        // update existing appendix2
        await prisma.formGroupement.updateMany({
          where: {
            nextFormId: form.id,
            initialFormId: initialFormFraction.form.id
          },
          data: { quantity: initialFormFraction.quantity }
        });
      } else {
        // create appendix2
        await prisma.formGroupement.create({
          data: {
            nextFormId: form.id,
            initialFormId: initialFormFraction.form.id,
            quantity: initialFormFraction.quantity
          }
        });
      }

      // set status to GROUPED if all groupement forms are SEALED and total quantity grouped is equal
      // to quantity received
      const formGroupements = await prisma.formGroupement.findMany({
        where: { initialFormId: initialFormFraction.form.id },
        include: { nextForm: true }
      });

      const { allSealed, quantityGrouped } = formGroupements.reduce(
        (acc, gr) => {
          return {
            allSealed: acc.allSealed && gr.nextForm.status === "SEALED",
            quantityGrouped: acc.quantityGrouped + gr.quantity
          };
        },
        { allSealed: true, quantityGrouped: 0 }
      );

      if (
        quantityGrouped == initialFormFraction.form.quantityReceived &&
        allSealed
      ) {
        await prisma.form.update({
          where: { id: initialFormFraction.form.id },
          data: { status: "GROUPED" }
        });
      }
    }

    return findAppendix2FormsById(form.id);
  };

export default buildSetAppendix2;
