import { FormExpanded, FormFlattened } from "./types";
import columns from "./columns";

/**
 * Flatten nested temporary storage detail object
 */
export function flattenForm(form: FormExpanded): FormFlattened {
  const { temporaryStorageDetail, ecoOrganisme, ...rest } = form;

  return {
    ...rest,
    ...(temporaryStorageDetail
      ? {
          temporaryStorageDestinationCompanySiret:
            temporaryStorageDetail.destinationCompanySiret,
          temporaryStorageDestinationCompanyName:
            temporaryStorageDetail.destinationCompanyName,
          temporaryStorageDetailCompanyAddress:
            temporaryStorageDetail.destinationCompanyAddress,
          temporaryStorageDetailCompanyMail:
            temporaryStorageDetail.destinationCompanyMail
        }
      : {}),
    ecoOrganismeName: ecoOrganisme?.name
  };
}

/**
 * Use label as key and format value
 */
export function formatForm(form: FormFlattened): { [key: string]: string } {
  return columns.reduce((acc, column) => {
    return {
      ...acc,
      ...(column.field in form
        ? { [column.label]: column.format(form[column.field]) }
        : {})
    };
  }, {});
}
