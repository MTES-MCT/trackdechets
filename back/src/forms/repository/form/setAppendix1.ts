import { Form, Status } from "@prisma/client";
import { RepositoryFnDeps } from "../../../common/repository/types";
import { PackagingInfo } from "../../../generated/graphql/types";
import { checkCanBeSealed } from "../../validation";
import { sumPackagingInfos } from "../helper";
import buildUpdateForm from "./update";
import buildUpdateManyForms from "./updateMany";

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

    // Then we automatically set:
    // - the transporter
    // - the destination
    // - the waste infos (code & name)
    await updateManyForms(
      newAppendix1Fractions.map(a => a.form.id),
      {
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
        transporterCompanyMail: form.transporterCompanyMail,
        transporterIsExemptedOfReceipt: form.transporterIsExemptedOfReceipt,
        transporterReceipt: form.transporterReceipt,
        transporterDepartment: form.transporterDepartment,
        transporterValidityLimit: form.transporterValidityLimit,
        transporterTransportMode: form.transporterTransportMode,
        transporterNumberPlate: form.transporterNumberPlate,
        transporterCustomInfo: form.transporterCustomInfo,
        recipientCompanySiret: form.recipientCompanySiret,
        recipientCompanyName: form.recipientCompanyName,
        recipientCompanyAddress: form.recipientCompanyAddress,
        recipientCompanyContact: form.recipientCompanyContact,
        recipientCompanyPhone: form.recipientCompanyPhone,
        recipientCompanyMail: form.recipientCompanyMail,
        ecoOrganismeName: form.ecoOrganismeName,
        ecoOrganismeSiret: form.ecoOrganismeSiret
      }
    );

    // Update container packagings
    const updateForm = buildUpdateForm({ prisma, user });
    await updateForm(
      { id: form.id },
      {
        wasteDetailsPackagingInfos: sumPackagingInfos(
          newAppendix1Fractions.map(
            fraction =>
              fraction.form.wasteDetailsPackagingInfos as PackagingInfo[]
          )
        ),
        wasteDetailsQuantity: newAppendix1Fractions.reduce(
          (sum, fraction) => sum + (fraction.form.wasteDetailsQuantity ?? 0),
          0
        )
      }
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
