import { FormWithTempStorage, FormWithTempStorageFlattened } from "./types";
import columns from "./columns";

/**
 * Flatten nested temporary storage detail object
 */
export function flattenForm(
  form: FormWithTempStorage
): FormWithTempStorageFlattened {
  const { temporaryStorageDetail, ...rest } = form;

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
      : {})
  };
}

/**
 * Use label as key and format value
 */
export function formatForm(
  form: FormWithTempStorageFlattened
): { [key: string]: string } {
  return columns.reduce((acc, column) => {
    return {
      ...acc,
      ...(column.field in form
        ? { [column.label]: column.format(form[column.field]) }
        : {})
    };
  }, {});
}
