import { Form, Status } from "@prisma/client";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { RepositoryFnDeps } from "../types";
import buildUpdateForm from "./update";

export type UpdateAppendix2Forms = (forms: Form[]) => Promise<Form[]>;

const buildUpdateAppendix2Forms: (
  deps: RepositoryFnDeps
) => UpdateAppendix2Forms = deps => async forms => {
  const { user, prisma } = deps;
  const updateForm = buildUpdateForm({ prisma, user });

  return Promise.all(
    forms.map(async form => {
      if (
        ![Status.AWAITING_GROUP, Status.GROUPED].includes(form.status as any)
      ) {
        return form;
      }
      const { id, quantityReceived } = form;
      const quantityGrouped =
        (
          await prisma.formGroupement.aggregate({
            _sum: { quantity: true },
            where: { initialFormId: id }
          })
        )._sum.quantity ?? 0;
      const groupementForms = (
        await prisma.formGroupement.findMany({
          where: { initialFormId: id },
          include: { nextForm: { select: { status: true } } }
        })
      ).map(g => g.nextForm);
      const allSealed = groupementForms.reduce(
        (acc, form) => acc && form.status !== Status.DRAFT,
        true
      );

      const allProcessed = groupementForms.reduce(
        (acc, form) =>
          acc &&
          [Status.PROCESSED, Status.NO_TRACEABILITY].includes(
            form.status as any
          ),
        true
      );

      const nextStatus = allProcessed
        ? Status.PROCESSED
        : allSealed && quantityGrouped >= quantityReceived // case > should not happen
        ? Status.GROUPED
        : Status.AWAITING_GROUP;

      if (form.status === Status.GROUPED && nextStatus === Status.PROCESSED) {
        return transitionForm(user, form, {
          type: EventType.MarkAsProcessed
        });
      } else if (
        form.status === Status.AWAITING_GROUP &&
        nextStatus === Status.GROUPED
      ) {
        return transitionForm(user, form, {
          type: EventType.MarkAsGrouped,
          formUpdateInput: { quantityGrouped }
        });
      } else {
        return updateForm({ id }, { status: nextStatus, quantityGrouped });
      }
    })
  );
};

export default buildUpdateAppendix2Forms;
