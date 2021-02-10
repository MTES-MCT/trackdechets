import * as yup from "yup";
import { isAllowedFormat } from "../dates";

/**
 * Check original value of a DateSchema is a date or a string formatted according to allowed_formats
 */
function allowedFormat(message?: string) {
  const defaultErrorMessage = "La date n'est pas formatée correctement";
  return (
    this
      // customize error message when yup.date() is passed non date formats
      .typeError(message ?? defaultErrorMessage)
      // some date string format like "05 October 2011 14:48 UTC" will
      // be correctly coerced to date by yup but are not allowed by prisma.
      // As we rely on yup for validation only and not for casting, make sure
      // only allowed date format are passed as original value
      .test(
        "is-allowed-date-format",
        message ?? defaultErrorMessage,
        (_value, { originalValue }) => isAllowedFormat(originalValue)
      )
  );
}

function requiredIf(condition: boolean, message?: string) {
  if (condition) {
    return this.nullable().notRequired();
  }

  // nullable to treat null as a missing value, not a type error
  return this.nullable().required(message);
}

export default function configureYup() {
  yup.setLocale({
    mixed: {
      default: "${path} est invalide",
      required: "${path} est un champ requis et doit avoir une valeur",
      notType: "${path} ne peut pas être null"
    }
  });

  yup.addMethod<yup.BaseSchema>(yup.mixed, "requiredIf", requiredIf);

  yup.addMethod<yup.DateSchema>(yup.date, "allowedFormat", allowedFormat);
}
