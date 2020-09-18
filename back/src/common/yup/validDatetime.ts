import { parse } from "date-fns";
import * as yup from "yup";

const allowedFormats = [
  "yyyy-MM-dd",
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd'T'HH:mm:ssX",
  "yyyy-MM-dd'T'HH:mm:ss.SSS",
  "yyyy-MM-dd'T'HH:mm:ss.SSSX"
];

/**
 * Check an incoming string is a date formatted according to allowed_formats
 * "2020-11-23", "2020-11-23T13:34:55","2020-11-23T13:34:55Z", "2020-11-23T13:34:55.987", "2020-11-23T13:34:55.987Z"
 */
export const isValidDatetime = str => {
  if (!str) {
    return true;
  }
  for (const fmt of allowedFormats) {
    // to know if a given string is correctly formatted date, we use date-fns parse
    // if format is correct, getDate() will return a nice Date object,
    // else parse will return an Invalid Date, i.e Date, whose time value is NaN
    if (!!parse(str, fmt, new Date()).getDate()) {
      return true;
    }
  }
};

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
  let validator = yup.string();
  if (!!required) {
    validator = validator.required(`Vous devez saisir une ${verboseFieldName}`);
  } else {
    validator = validator.nullable();
  }

  return validator.test(
    "valid-required-date",
    `La ${verboseFieldName} n'est pas formatée correctement`,
    v => {
      return isValidDatetime(v);
    }
  );
}
