import { EmitterType, Form, Status } from "@prisma/client";
import { UserInputError } from "apollo-server-core";
import { RepositoryFnDeps } from "../types";
import buildFindAppendix2FormsById from "./findAppendix2FormsById";
import { getFinalDestinationSiret } from "../../database";
import buildUpdateAppendix2Forms from "./updateAppendix2Forms";
import { Decimal } from "decimal.js-light";

class FormFraction {
  form: Form;
  quantity: number;
}

class SetAppendix2Args {
  form: Form;
  appendix2: FormFraction[] | null;
}

export type SetAppendix2Fn = (args: SetAppendix2Args) => Promise<Form[]>;

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
  async ({ form, appendix2 }) => {
    const findAppendix2FormsById = buildFindAppendix2FormsById({
      prisma,
      user
    });

    const currentAppendix2Forms = await findAppendix2FormsById(form.id);

    // check groupement form type is APPENDIX2 if
    if (
      (appendix2?.length ||
        (currentAppendix2Forms.length && appendix2?.length !== 0)) &&
      form.emitterType !== EmitterType.APPENDIX2
    ) {
      throw new UserInputError(
        "emitter.type doit être égal à APPENDIX2 lorsque appendix2Forms n'est pas vide"
      );
    }

    if (appendix2 === null) {
      return currentAppendix2Forms;
    }

    // check emitter of groupement form matches destination of initial form
    for (const { form: initialForm } of appendix2) {
      const appendix2DestinationSiret = await getFinalDestinationSiret(
        initialForm
      );

      if (form.emitterCompanySiret !== appendix2DestinationSiret) {
        throw new UserInputError(
          `Le bordereau ${initialForm.id} n'est pas en possession du nouvel émetteur`
        );
      }
    }

    // check grouped forms have status AWAITING_GROUP or GROUPED
    const unawaitingGroupForm = await prisma.form.findFirst({
      where: {
        id: { in: appendix2.map(({ form }) => form.id) },
        status: { not: { in: [Status.AWAITING_GROUP, Status.GROUPED] } }
      }
    });

    if (unawaitingGroupForm) {
      throw new UserInputError(
        `Le bordereau ${unawaitingGroupForm.id} n'est pas en attente de regroupement`
      );
    }

    // check quantity grouped in each grouped form is not greater than quantity received
    for (const { form: initialForm, quantity } of appendix2) {
      if (quantity <= 0) {
        throw new UserInputError(
          "La quantité regroupée doit être strictement supérieure à 0"
        );
      }
      const quantityGroupedInOtherForms =
        (
          await prisma.formGroupement.aggregate({
            _sum: { quantity: true },
            where: {
              initialFormId: initialForm.id,
              nextFormId: { not: form.id }
            }
          })
        )._sum.quantity ?? 0;

      const quantityLeftToGroup = new Decimal(
        initialForm.quantityReceived
      ).minus(quantityGroupedInOtherForms);

      if (quantityLeftToGroup.equals(0)) {
        throw new UserInputError(
          `Le bordereau ${initialForm.readableId} a déjà été regroupé en totalité`
        );
      }

      if (new Decimal(quantity).greaterThan(quantityLeftToGroup)) {
        throw new UserInputError(
          `La quantité restante à regrouper sur le BSDD ${
            initialForm.readableId
          } est de ${quantityLeftToGroup.toFixed(
            3
          )} T. Vous tentez de regrouper ${quantity} T.`
        );
      }
    }

    // delete existing appendix2 not present in input
    await prisma.formGroupement.deleteMany({
      where: {
        nextFormId: form.id,
        initialFormId: { notIn: appendix2.map(({ form }) => form.id) }
      }
    });

    // update or create new appendix2
    for (const { form: initialForm, quantity } of appendix2) {
      if (currentAppendix2Forms.map(f => f.id).includes(initialForm.id)) {
        // update existing appendix2
        await prisma.formGroupement.updateMany({
          where: {
            nextFormId: form.id,
            initialFormId: initialForm.id
          },
          data: { quantity: quantity }
        });
      } else {
        // create appendix2
        await prisma.formGroupement.create({
          data: {
            nextFormId: form.id,
            initialFormId: initialForm.id,
            quantity: quantity
          }
        });
      }
    }

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

    return findAppendix2FormsById(form.id);
  };

export default buildSetAppendix2;
