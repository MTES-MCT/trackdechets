import { Form, Prisma, Status } from "@prisma/client";
import { Decimal } from "decimal.js";
import { RepositoryFnDeps } from "../../../common/repository/types";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import buildUpdateManyForms from "./updateMany";
import { FormWithForwardedIn, FormWithForwardedInInclude } from "../../types";
import { processDbIdentifiersByChunk } from "../../../bsds/indexation/bulkIndexBsds";

type FormForUpdateAppendix2Forms = Form & FormWithForwardedIn;

export const FormForUpdateAppendix2FormsInclude = FormWithForwardedInInclude;

const DECIMAL_WEIGHT_PRECISION = 6; // gramme

export type UpdateAppendix2Forms = (
  forms: FormForUpdateAppendix2Forms[]
) => Promise<void>;

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

  // Quantité regroupée par identifiant de bordereau
  const quantitGroupedByFormId: { [key: string]: number } = {};

  for (const form of forms) {
    if (![Status.AWAITING_GROUP, Status.GROUPED].includes(form.status as any)) {
      continue;
    }

    const quantityReceived = form.forwardedIn
      ? form.forwardedIn.quantityReceived
      : form.quantityReceived;

    const quantityGrouped = new Decimal(
      formGroupements
        .filter(grp => grp.initialFormId === form.id)
        .map(grp => grp.quantity)
        .reduce((prev, cur) => prev + cur, 0) ?? 0
    ).toDecimalPlaces(DECIMAL_WEIGHT_PRECISION); // set precision to gramme

    quantitGroupedByFormId[form.id] = quantityGrouped.toNumber();

    const groupementForms = formGroupements
      .filter(grp => grp.initialFormId === form.id)
      .map(g => g.nextForm);

    // on a quelques quantityReceived avec des décimales au delà du gramme
    const groupedInTotality =
      quantityReceived &&
      quantityGrouped.greaterThanOrEqualTo(
        new Decimal(quantityReceived).toDecimalPlaces(DECIMAL_WEIGHT_PRECISION) // limit precision to circumvent rogue decimal digits
      ); // case > should not happen

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
        form.id
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
        form.id
      ]);
    } else {
      formUpdatesByStatus.set(nextStatus, [
        ...(formUpdatesByStatus.get(nextStatus) ?? []),
        form.id
      ]);
    }
  }

  const promises: Promise<Prisma.BatchPayload>[] = [];
  for (const [status, ids] of formUpdatesByStatus.entries()) {
    promises.push(updateManyForms(ids, { status }));
  }

  await Promise.all(promises);

  // Ici on peut avoir 250 bordereaux à mettre à jour dans le pire des cas
  // On batche donc les updates par 50 pour éviter un bottleneck
  await processDbIdentifiersByChunk(
    Object.keys(quantitGroupedByFormId),
    async formIds => {
      // met à jour la quantité regroupée sur chaque bordereau
      await Promise.all(
        formIds.map(formId => {
          return prisma.form.update({
            where: { id: formId },
            data: { quantityGrouped: quantitGroupedByFormId[formId] }
          });
        })
      );
    },
    50
  );
};

export default buildUpdateAppendix2Forms;
