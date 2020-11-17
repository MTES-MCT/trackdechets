import { FormExpanded, FormFlattened } from "./types";

/**
 * Flatten nested temporary storage detail object
 */
export function flattenForm(formExpanded: FormExpanded): FormFlattened {
  const {
    recipientIsTempStorage,
    temporaryStorageDetail,
    ...rest
  } = formExpanded;

  const form: FormFlattened = { ...rest };

  if (recipientIsTempStorage === true) {
    // recipient is a temp storer
    form.temporaryStorageCompanySiret = form.recipientCompanySiret;
    form.recipientCompanySiret = null;
    form.temporaryStorageCompanyName = form.recipientCompanyName;
    form.recipientCompanyName = null;
    form.temporaryStorageCompanyAddress = form.recipientCompanyAddress;
    form.recipientCompanyAddress = null;
    form.temporaryStorageCompanyMail = form.recipientCompanyMail;
    form.recipientCompanyMail = null;
    form.temporaryStorageCompanyContact = form.recipientCompanyContact;
    form.recipientCompanyContact = null;
    form.temporaryStorageCompanyPhone = form.recipientCompanyPhone;
    form.recipientCompanyPhone = null;

    // add destination and second transporter info
    form.recipientCompanySiret =
      temporaryStorageDetail?.destinationCompanySiret;
    form.recipientCompanyName = temporaryStorageDetail?.destinationCompanyName;
    form.recipientCompanyAddress =
      temporaryStorageDetail?.destinationCompanyAddress;
    form.recipientCompanyMail = temporaryStorageDetail?.destinationCompanyMail;
    form.recipientCompanyContact =
      temporaryStorageDetail?.destinationCompanyContact;
    form.recipientCompanyPhone =
      temporaryStorageDetail?.destinationCompanyPhone;
    form.temporaryStorageTransporterCompanySiret =
      temporaryStorageDetail?.transporterCompanySiret;
    form.temporaryStorageTransporterCompanyName =
      temporaryStorageDetail?.transporterCompanyName;
    form.temporaryStorageTransporterCompanyAddress =
      temporaryStorageDetail?.transporterCompanyAddress;
    form.temporaryStorageTransporterIsExemptedOfReceipt =
      temporaryStorageDetail?.transporterIsExemptedOfReceipt;
    form.temporaryStorageTransporterReceipt =
      temporaryStorageDetail?.transporterReceipt;
    form.temporaryStorageTransporterValidityLimit = temporaryStorageDetail?.transporterValidityLimit?.toISOString();
    form.temporaryStorageTransporterNumberPlate =
      temporaryStorageDetail?.transporterNumberPlate;
  }

  return form;
}
