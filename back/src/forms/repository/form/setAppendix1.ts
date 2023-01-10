import { Form, Status } from "@prisma/client";
import { RepositoryFnDeps } from "../../../common/repository/types";
import { checkCanBeSealed } from "../../validation";

class FormFraction {
  form: Form;
  quantity: number;
}

class SetAppendix1Args {
  form: Form;
  appendix1: FormFraction[] | null;
  currentAppendix1Forms: Form[];
}

export type SetAppendix1Fn = (args: SetAppendix1Args) => Promise<void>;

/**
 * This function is called each time an appendix1 form is added to a container form.
 */
export function buildSetAppendix1({
  prisma
}: RepositoryFnDeps): SetAppendix1Fn {
  return async ({ form, appendix1, currentAppendix1Forms }) => {
    // First, seal all drafts
    const draftAppendix1Forms = appendix1
      .map(a => a.form)
      .filter(f => f.status === Status.DRAFT);
    for (const draft of draftAppendix1Forms) {
      await checkCanBeSealed(draft);
    }

    await prisma.form.updateMany({
      where: { id: { in: draftAppendix1Forms.map(f => f.id) } },
      data: { status: Status.SEALED }
    });

    // Then we automatically set:
    // - the transporter
    // - the destination
    // - the waste infos (code & name)
    const appendix1Ids = appendix1.map(a => a.form.id);
    await prisma.form.updateMany({
      where: { id: { in: appendix1Ids } },
      data: {
        // Most data are copied from the container form and not editable:
        // - waste infos
        // - transporter
        // - recipient
        // - if its emitted by an eco organisme or not
        wasteDetailsCode: form.wasteDetailsCode,
        wasteDetailsIsDangerous: form.wasteDetailsIsDangerous,
        wasteDetailsName: form.wasteDetailsName,
        transporterCompanySiret: form.transporterCompanySiret,
        transporterCompanyName: form.transporterCompanyName,
        transporterCompanyAddress: form.transporterCompanyAddress,
        transporterCompanyContact: form.transporterCompanyContact,
        transporterCompanyVatNumber: form.transporterCompanyVatNumber,
        transporterCompanyPhone: form.transporterCompanyPhone,
        transporterCompanyMail: form.recipientCompanyMail,
        recipientCompanySiret: form.recipientCompanySiret,
        recipientCompanyName: form.recipientCompanyName,
        recipientCompanyAddress: form.recipientCompanyAddress,
        recipientCompanyContact: form.recipientCompanyContact,
        recipientCompanyPhone: form.recipientCompanyPhone,
        recipientCompanyMail: form.recipientCompanyMail,
        emittedByEcoOrganisme: form.emittedByEcoOrganisme
      }
    });

    // Lastly, manage groups...
    // Remove old ones
    const formsNoLongerGroupedIds = currentAppendix1Forms
      .filter(cf => appendix1.every(({ form }) => form.id !== cf.id))
      .map(form => form.id);
    await prisma.formGroupement.deleteMany({
      where: {
        nextFormId: form.id,
        initialFormId: { in: formsNoLongerGroupedIds }
      }
    });
    // And create new ones
    const fractionsNewlyGrouped = appendix1.filter(({ form }) =>
      currentAppendix1Forms.every(cf => cf.id !== form.id)
    );
    await prisma.formGroupement.createMany({
      data: fractionsNewlyGrouped.map(({ form: initialForm, quantity }) => ({
        nextFormId: form.id,
        initialFormId: initialForm.id,
        quantity
      }))
    });
  };
}
