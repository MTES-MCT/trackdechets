import { Form, Status } from "@prisma/client";
import { RepositoryFnDeps } from "../../../common/repository/types";
import { checkCanBeSealed } from "../../validation";
import buildUpdateForm from "./update";
import buildUpdateManyForms from "./updateMany";
import { getFirstTransporter } from "../../database";

class FormFraction {
  form: Form;
  quantity: number;
}

class SetAppendix1Args {
  form: Form;
  appendix1: FormFraction[];
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
  return async ({
    form,
    appendix1: newAppendix1Fractions,
    currentAppendix1Forms
  }) => {
    const updateManyForms = buildUpdateManyForms({ prisma, user });
    const updateForm = buildUpdateForm({ prisma, user });

    // First, seal all drafts
    const draftAppendix1Forms = newAppendix1Fractions
      .map(a => a.form)
      .filter(f => f.status === Status.DRAFT);
    for (const draft of draftAppendix1Forms) {
      await checkCanBeSealed(draft);
    }
    await updateManyForms(
      draftAppendix1Forms.map(f => f.id),
      { status: Status.SEALED }
    );

    const transporter = await getFirstTransporter(form);

    // Then we automatically set:
    // - the transporter
    // - the destination
    // - the waste infos (code & name)
    await Promise.all(
      newAppendix1Fractions.map(({ form: appendix1Form }) =>
        updateForm(
          { id: appendix1Form.id },
          {
            // Most data are copied from the container form and not editable:
            // - waste infos
            // - transporter
            // - recipient
            // - if its emitted by an eco organisme or not
            wasteDetailsCode: form.wasteDetailsCode,
            wasteDetailsIsDangerous: form.wasteDetailsIsDangerous,
            wasteDetailsName: form.wasteDetailsName,

            recipientCompanySiret: form.recipientCompanySiret,
            recipientCompanyName: form.recipientCompanyName,
            recipientCompanyAddress: form.recipientCompanyAddress,
            recipientCompanyContact: form.recipientCompanyContact,
            recipientCompanyPhone: form.recipientCompanyPhone,
            recipientCompanyMail: form.recipientCompanyMail,
            ecoOrganismeName: form.ecoOrganismeName,
            ecoOrganismeSiret: form.ecoOrganismeSiret,
            transporters: {
              deleteMany: {},
              create: {
                number: 1,
                transporterCompanySiret: transporter?.transporterCompanySiret,
                transporterCompanyName: transporter?.transporterCompanyName,
                transporterCompanyAddress:
                  transporter?.transporterCompanyAddress,
                transporterCompanyContact:
                  transporter?.transporterCompanyContact,
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
                transporterCustomInfo: transporter?.transporterCustomInfo
              }
            }
          }
        )
      )
    );

    // Lastly, manage groups...
    // Remove old ones
    const formsNoLongerGroupedIds = currentAppendix1Forms
      .filter(cf =>
        newAppendix1Fractions.every(({ form }) => form.id !== cf.id)
      )
      .map(form => form.id);
    await prisma.formGroupement.deleteMany({
      where: {
        nextFormId: form.id,
        initialFormId: { in: formsNoLongerGroupedIds }
      }
    });
    // And create new ones
    const fractionsNewlyGrouped = newAppendix1Fractions.filter(({ form }) =>
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
