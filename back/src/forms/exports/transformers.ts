import { FormWithTempStorage, FormWithTempStorageFlattened } from "./types";
import labels from "./labels";
import formats from "./formats";

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
 * Sort keys of a form object to ensure csv columns are in the right order
 * @param form
 */
export function sortFormKeys(
  form: FormWithTempStorageFlattened
): FormWithTempStorageFlattened {
  return Object.keys(labels)
    .filter(k => Object.keys(form).includes(k))
    .reduce((acc, k) => {
      acc[k] = form[k];
      return acc;
    }, {}) as FormWithTempStorageFlattened;
}

/**
 * Format date and boolean values
 */
export function formatForm(form: FormWithTempStorageFlattened) {
  return Object.keys(form).reduce((acc, k) => {
    acc[k] = formats[k](form[k]);
    return acc;
  }, {});
}

/**
 * Replace form keys with their corresponding labels
 */
export function labelizeForm(form) {
  return Object.keys(form).reduce((acc, k) => {
    const label = labels[k];
    acc[label] = form[k];
    return acc;
  }, {});
}
