import { parse, isDate, isValid } from "date-fns";
import * as yup from "yup";

const allowedFormats = [
  "yyyy-MM-dd",
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd'T'HH:mm:ssX",
  "yyyy-MM-dd'T'HH:mm:ss.SSS",
  "yyyy-MM-dd'T'HH:mm:ss.SSSX"
];

/**
 * Check input is a date or a date string formatted according to allowed_formats
 * "2020-11-23", "2020-11-23T13:34:55","2020-11-23T13:34:55Z", "2020-11-23T13:34:55.987", "2020-11-23T13:34:55.987Z"
 */
function parseDateString(_, originalValue) {
  if (isDate(originalValue)) {
    return originalValue;
  }

  for (const fmt of allowedFormats) {
    const date = parse(originalValue, fmt, new Date());
    if (isValid(date)) {
      return date;
    }
  }

  return null;
}

/**
 * Check a provided string is parsable as a valid date
 * We can't rely solely on yup, because strings like "20200120" are accepted but are passed unformatted to prisma/postgres which
 * causes server errors.
 *
 * The validation is built upon string(), because date() passes an already processed value to chained method, thus allowing
 * some formatted dates we don't want to accept.
 *
 * @param verboseFieldName - human readable field name, for error messages
 * @param required - is this field required ?
 */
export default function validDatetime({ verboseFieldName, required = false }) {
  const validator = yup
    .date()
    .typeError(`La ${verboseFieldName} n'est pas formatée correctement`)
    .transform(parseDateString);

  if (!!required) {
    return validator.required(`Vous devez saisir une ${verboseFieldName}`);
  }

  return validator.nullable();
}
