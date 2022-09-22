import { EmitterType, Form, Status } from "@prisma/client";
import { UserInputError } from "apollo-server-core";
import { RepositoryFnDeps } from "../types";
import buildFindAppendix2FormsById from "./findAppendix2FormsById";
import {
  getFinalDestinationSirets,
  getFormOrFormNotFound
} from "../../database";
import { Decimal } from "decimal.js-light";
import {
  AppendixFormInput,
  InitialFormFractionInput
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { UpdateAppendix2Forms } from "./updateAppendix2Forms";

class FormFraction {
  form: Form;
  quantity: number;
}

class SetAppendix2Args {
  form: Form;
  appendix2: FormFraction[] | null;
  currentAppendix2Forms?: Form[];
  updateAppendix2Forms: UpdateAppendix2Forms;
}

export type SetAppendix2Fn = (args: SetAppendix2Args) => Promise<void>;

export async function buildAppendix2FormsInput(
  grouping?: InitialFormFractionInput[],
  appendix2Forms?: AppendixFormInput[]
): Promise<FormFraction[]> {
  let appendix2: FormFraction[] = null;

  if (grouping) {
    appendix2 = await Promise.all(
      grouping.map(async ({ form, quantity }) => {
        const foundForm = await getFormOrFormNotFound(form);
        return {
          form: foundForm,
          quantity:
            quantity ??
            new Decimal(foundForm.quantityReceived)
              .minus(foundForm.quantityGrouped)
              .toNumber()
        };
      })
    );
  } else if (appendix2Forms) {
    appendix2 = await Promise.all(
      appendix2Forms.map(async ({ id }) => {
        const initialForm = await getFormOrFormNotFound({ id });
        return {
          form: initialForm,
          quantity: initialForm.quantityReceived
        };
      })
    );
  }
  return appendix2;
}

export async function preCheckAppendix2(
  form,
  grouping,
  appendix2Forms
): Promise<{
  appendix2: FormFraction[] | null;
  currentAppendix2Forms: Form[];
}> {
  const appendix2 = await buildAppendix2FormsInput(grouping, appendix2Forms);
  const findAppendix2FormsById = buildFindAppendix2FormsById({
    prisma
  });

  const currentAppendix2Forms = await findAppendix2FormsById(form.id);

  // check groupement form type is APPENDIX2 if appendix2 is not empty
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
    return {
      appendix2,
      currentAppendix2Forms
    };
  }

  // check emitter of groupement form matches destination of initial form
  const finalDestinationSirets = await getFinalDestinationSirets(
    appendix2.map(({ form }) => form)
  );

  appendix2.map(({ form: initialForm }, index) => {
    const appendix2DestinationSiret = finalDestinationSirets[index];
    if (form.emitterCompanySiret !== appendix2DestinationSiret) {
      throw new UserInputError(
        `Le bordereau ${initialForm.id} n'est pas en possession du nouvel émetteur`
      );
    }
  });

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

  // check each form appears in only one form fraction
  const formIds = appendix2.map(({ form }) => form.id);
  const duplicates = formIds.filter(
    (id, index) => formIds.indexOf(id) !== index
  );
  if (duplicates.length > 0) {
    throw new UserInputError(
      `Impossible d'associer plusieurs fractions du même bordereau initial sur un même bordereau` +
        ` de regroupement. Identifiant du ou des bordereaux initiaux concernés : ${duplicates.join(
          ", "
        )}`
    );
  }

  // check quantity grouped in each grouped form is not greater than quantity received
  await Promise.all(
    appendix2.map(async ({ form: initialForm, quantity }) => {
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

      const quantityLeftToGroup = new Decimal(initialForm.quantityReceived)
        .minus(quantityGroupedInOtherForms)
        .toDecimalPlaces(6); // set precision to gramme

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
    })
  );

  return {
    appendix2,
    currentAppendix2Forms
  };
}

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
  ({ prisma }) =>
  async ({ form, appendix2, currentAppendix2Forms, updateAppendix2Forms }) => {
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

    await updateAppendix2Forms(dirtyForms);
  };

export default buildSetAppendix2;
