import { Form, Status } from "@prisma/client";
import { RepositoryFnDeps } from "../../../common/repository/types";
import { checkCanBeSealed } from "../../validation";
import buildUpdateForm from "./update";
import buildUpdateManyForms from "./updateMany";
import {
  enqueueUpdatedBsdToIndex,
  enqueueBsdToDelete
} from "../../../queue/producers/elastic";
import { FormWithTransporters } from "../../types";

class FormFraction {
  form: Form;
  quantity: number;
}

class SetAppendix1Args {
  form: Form & FormWithTransporters;
  newAppendix1Fractions: FormFraction[] | null;
  currentAppendix1Forms: Form[];
}

export type SetAppendix1Fn = (args: SetAppendix1Args) => Promise<void>;

/**
 * This function is called each time an appendix1 form is added to a container form (or updated).
 */
export function buildSetAppendix1({
  prisma,
  user
}: RepositoryFnDeps): SetAppendix1Fn {
  return async ({ form, newAppendix1Fractions, currentAppendix1Forms }) => {
    // 1. If some of the new appendix1 are drafts, seal them
    if (newAppendix1Fractions) {
      const newDraftAppendix1Forms = newAppendix1Fractions
        .map(f => f.form)
        .filter(f => f.status === Status.DRAFT);
      await sealAllNewDrafts(newDraftAppendix1Forms, { prisma, user });
    }

    const resultingAppendix1FormIds = newAppendix1Fractions
      ? newAppendix1Fractions.map(f => f.form.id)
      : currentAppendix1Forms.map(f => f.id);

    // 2. Then we automatically set:
    // - the transporter
    // - the destination
    // - the waste infos (code & name)
    // We do it on all appendix1, as sometimes the grouping doesnt change
    // but some of the container values do.
    await setAppendix1AutomaticValues(form, resultingAppendix1FormIds, {
      prisma,
      user
    });

    // 3. Lastly, manage groups.
    // If there is no new fractions, it means that the groups haven't changed.
    if (!newAppendix1Fractions) {
      return;
    }

    const currentAppendix1FormsIds = currentAppendix1Forms.map(f => f.id);

    // 3.1 Unlink forms that are no longer grouped, and un-index them so that they disappear from the dashboard
    const formsNoLongerGroupedIds = currentAppendix1FormsIds.filter(
      id => !resultingAppendix1FormIds.includes(id)
    );

    await prisma.formGroupement.deleteMany({
      where: {
        nextFormId: form.id,
        initialFormId: { in: formsNoLongerGroupedIds }
      }
    });
    prisma.addAfterCommitCallback(() => {
      for (const id of formsNoLongerGroupedIds) {
        enqueueBsdToDelete(id);
      }
    });

    // 3.2 Create new groups, and index appendix1 so that they appear in the dashboard
    const fractionsNewlyGrouped = newAppendix1Fractions.filter(
      ({ form }) => !currentAppendix1FormsIds.includes(form.id)
    );
    await prisma.formGroupement.createMany({
      data: fractionsNewlyGrouped.map(({ form: initialForm, quantity }) => ({
        nextFormId: form.id,
        initialFormId: initialForm.id,
        quantity
      }))
    });
    prisma.addAfterCommitCallback(() => {
      for (const { form: initialForm } of fractionsNewlyGrouped) {
        enqueueUpdatedBsdToIndex(initialForm.readableId);
      }
    });
  };
}

async function sealAllNewDrafts(
  newDrafts: Form[],
  { prisma, user }: RepositoryFnDeps
) {
  for (const draft of newDrafts) {
    await checkCanBeSealed(draft);
  }

  const updateManyForms = buildUpdateManyForms({ prisma, user });
  await updateManyForms(
    newDrafts.map(f => f.id),
    { status: Status.SEALED }
  );
}

async function setAppendix1AutomaticValues(
  container: Form & FormWithTransporters,
  appendix1FormIds: string[],
  { prisma, user }: RepositoryFnDeps
) {
  const updateForm = buildUpdateForm({ prisma, user });

  const transporter = container.transporters[0];

  // No batched update because we have to create / destroy transporters.
  await Promise.all(
    appendix1FormIds.map(id =>
      updateForm(
        { id },
        {
          // Most data are copied from the container form and not editable:
          // - waste infos
          // - transporter
          // - recipient
          // - if its emitted by an eco organisme or not
          wasteDetailsCode: container.wasteDetailsCode,
          wasteDetailsIsDangerous: container.wasteDetailsIsDangerous,
          wasteDetailsName: container.wasteDetailsName,
          wasteDetailsQuantityType: "ESTIMATED",

          recipientCompanySiret: container.recipientCompanySiret,
          recipientCompanyName: container.recipientCompanyName,
          recipientCompanyAddress: container.recipientCompanyAddress,
          recipientCompanyContact: container.recipientCompanyContact,
          recipientCompanyPhone: container.recipientCompanyPhone,
          recipientCompanyMail: container.recipientCompanyMail,
          recipientCap: container.recipientCap,
          recipientProcessingOperation: container.recipientProcessingOperation,
          ecoOrganismeName: container.ecoOrganismeName,
          ecoOrganismeSiret: container.ecoOrganismeSiret,
          transporters: {
            deleteMany: {},
            create: {
              number: 1,
              transporterCompanySiret: transporter?.transporterCompanySiret,
              transporterCompanyName: transporter?.transporterCompanyName,
              transporterCompanyAddress: transporter?.transporterCompanyAddress,
              transporterCompanyContact: transporter?.transporterCompanyContact,
              transporterCompanyVatNumber:
                transporter?.transporterCompanyVatNumber,
              transporterCompanyPhone: transporter?.transporterCompanyPhone,
              transporterCompanyMail: transporter?.transporterCompanyMail,
              transporterIsExemptedOfReceipt:
                transporter?.transporterIsExemptedOfReceipt,
              transporterReceipt: transporter?.transporterReceipt,
              transporterDepartment: transporter?.transporterDepartment,
              transporterValidityLimit: transporter?.transporterValidityLimit,
              transporterTransportMode: transporter?.transporterTransportMode,
              transporterNumberPlate: transporter?.transporterNumberPlate,
              transporterCustomInfo: transporter?.transporterCustomInfo,
              readyToTakeOver: true
            }
          }
        }
      )
    )
  );
}
