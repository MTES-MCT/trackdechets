import { parse } from "date-fns";
import { prisma, EcoOrganisme } from "../generated/prisma-client";
import { TransporterInput } from "../generated/graphql/types";
import { EcoOrganismeNotFound, InvaliSecurityCode } from "./errors";
import { UserInputError } from "apollo-server-express";
import { InvalidDateTime } from "../common/errors";

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
export function validDatetime({ verboseFieldName, required = false }, yup) {
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

export function validCompany({ verboseFieldName }, yup) {
  return yup.object().shape({
    name: yup
      .string()
      .required(`${verboseFieldName}: Le nom de l'entreprise est obligatoire`),
    siret: yup
      .string()
      .required(
        `${verboseFieldName}: La sélection d'une entreprise par SIRET est obligatoire`
      ),
    address: yup
      .string()
      .required(
        `${verboseFieldName}: L'adresse d'une entreprise est obligatoire`
      ),
    contact: yup
      .string()
      .required(
        `${verboseFieldName}: Le contact dans l'entreprise est obligatoire`
      ),
    phone: yup
      .string()
      .required(
        `${verboseFieldName}: Le téléphone de l'entreprise est obligatoire`
      ),
    mail: yup
      .string()
      .required(`${verboseFieldName}: L'email de l'entreprise est obligatoire`)
  });
}

export async function validateEcorganisme(ecoOrganisme: {
  id: string;
}): Promise<EcoOrganisme> {
  const eo = await prisma.ecoOrganisme({
    id: ecoOrganisme.id
  });
  if (!eo) {
    throw new EcoOrganismeNotFound(ecoOrganisme.id);
  }
  return eo;
}

export async function validateSecurityCode(
  siret: string,
  securityCode: number
) {
  const exists = await prisma.$exists.company({
    siret,
    securityCode
  });
  if (!exists) {
    throw new InvaliSecurityCode();
  }
}

export async function validateTransporter(transporter: TransporterInput) {
  if (transporter.isExemptedOfReceipt !== true) {
    if (!transporter.receipt) {
      throw new UserInputError(
        "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, le numéro de récépissé est donc est obligatoire"
      );
    }
    if (!transporter.department) {
      throw new UserInputError(
        "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, le département du récépissé est donc est obligatoire"
      );
    }
    if (!transporter.validityLimit) {
      throw new UserInputError(
        "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, la date de limite de validité du récépissé est donc est obligatoire"
      );
    } else {
      if (!isValidDatetime(transporter.validityLimit)) {
        throw new InvalidDateTime("validityLimit");
      }
    }
  }
}
