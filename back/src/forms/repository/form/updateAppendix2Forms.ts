import { Form, Prisma, Status } from "@prisma/client";
import { Decimal } from "decimal.js-light";
import { RepositoryFnDeps } from "../../../common/repository/types";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import buildUpdateManyForms from "./updateMany";

export type UpdateAppendix2Forms = (forms: Form[]) => Promise<void>;

const buildUpdateAppendix2Forms: (
  deps: RepositoryFnDeps
) => UpdateAppendix2Forms = deps => async forms => {
  const { user, prisma } = deps;
  const updateManyForms = buildUpdateManyForms({ prisma, user });

  const formIds = forms.map(form => form.id);
  const formGroupements = await prisma.formGroupement.findMany({
    where: { initialFormId: { in: formIds } },
    include: { nextForm: { select: { status: true } } }
  });

  const formUpdatesByStatus = new Map<Status, string[]>();
  for (const form of forms) {
    if (![Status.AWAITING_GROUP, Status.GROUPED].includes(form.status as any)) {
      continue;
    }
    const { id, quantityReceived } = form;

    const quantityGrouped = new Decimal(
      formGroupements
        .filter(grp => grp.initialFormId === id)
        .map(grp => grp.quantity)
        .reduce((prev, cur) => prev + cur, 0) ?? 0
    ).toDecimalPlaces(6); // set precision to gramme

    const groupementForms = formGroupements
      .filter(grp => grp.initialFormId === id)
      .map(g => g.nextForm);

    const groupedInTotality =
      quantityReceived &&
      quantityGrouped.greaterThanOrEqualTo(quantityReceived); // case > should not happen

    const allSealed =
      groupementForms.length &&
      groupedInTotality &&
      groupementForms.reduce(
        (acc, form) => acc && form.status !== Status.DRAFT,
        true
      );

    const allProcessed =
      groupementForms.length &&
      groupedInTotality &&
      groupementForms.reduce(
        (acc, form) =>
          acc &&
          [
            Status.PROCESSED,
            Status.NO_TRACEABILITY,
            Status.FOLLOWED_WITH_PNTTD
          ].includes(form.status as any),
        true
      );

    const nextStatus = allProcessed
      ? Status.PROCESSED
      : allSealed
      ? Status.GROUPED
      : Status.AWAITING_GROUP;

    if (form.status === Status.GROUPED && nextStatus === Status.PROCESSED) {
      const status = transitionForm(form, {
        type: EventType.MarkAsProcessed
      });

      formUpdatesByStatus.set(status, [
        ...(formUpdatesByStatus.get(status) ?? []),
        id
      ]);
    } else if (
      form.status === Status.AWAITING_GROUP &&
      nextStatus === Status.GROUPED
    ) {
      const status = transitionForm(form, {
        type: EventType.MarkAsGrouped
      });
      formUpdatesByStatus.set(status, [
        ...(formUpdatesByStatus.get(status) ?? []),
        id
      ]);
    } else {
      formUpdatesByStatus.set(nextStatus, [
        ...(formUpdatesByStatus.get(nextStatus) ?? []),
        id
      ]);
    }
  }

  const promises: Promise<Prisma.BatchPayload>[] = [];
  for (const [status, ids] of formUpdatesByStatus.entries()) {
    promises.push(updateManyForms(ids, { status }));
  }

  await Promise.all(promises);
};

export default buildUpdateAppendix2Forms;
