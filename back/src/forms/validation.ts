import { parse } from "date-fns";
import * as Yup from "yup";
import { prisma, EcoOrganisme, Form } from "../generated/prisma-client";
import countries from "world-countries";
import {
  TransporterInput,
  ReceivedFormInput,
  CompanyInput
} from "../generated/graphql/types";
import { EcoOrganismeNotFound, InvaliSecurityCode } from "./errors";
import { UserInputError } from "apollo-server-express";
import { InvalidDateTime } from "../common/errors";
import { WASTES_CODES } from "../common/constants";

const allowedFormats = [
  "yyyy-MM-dd",
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd'T'HH:mm:ssX",
  "yyyy-MM-dd'T'HH:mm:ss.SSS",
  "yyyy-MM-dd'T'HH:mm:ss.SSSX"
];

Yup.setLocale({
  mixed: {
    default: "${path} est invalide",
    required: "${path} est un champ requis et doit avoir une valeur",
    notType: "${path} ne peut pas être null"
  }
} as Yup.LocaleObject);

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

type CompanyValidationOpts = {
  verboseFieldName: string;
  allowForeign?: boolean;
};

/**
 * GraphQL type `CompanyInput` is used both in createForm and updateForm (where it admits partial data)
 * and in different mutations markAsResealed, markAsResent, etc where fields are required
 * This validation function should be used in the mutations where fields are required
 */
export function validateCompany(
  company: CompanyInput,
  { verboseFieldName, allowForeign = false }: CompanyValidationOpts
) {
  const schema = Yup.object().shape<CompanyInput>({
    name: Yup.string().required(
      `${verboseFieldName}: Le nom de l'entreprise est obligatoire`
    ),
    siret: allowForeign
      ? Yup.string().when("country", {
          is: country => country == null || country === "FR",
          then: Yup.string().required(
            `${verboseFieldName}: La sélection d'une entreprise par SIRET est obligatoire`
          ),
          otherwise: Yup.string().nullable()
        })
      : Yup.string().required(
          `${verboseFieldName}: La sélection d'une entreprise par SIRET est obligatoire`
        ),
    address: Yup.string().required(
      `${verboseFieldName}: L'adresse d'une entreprise est obligatoire`
    ),
    country: allowForeign
      ? Yup.string()
          .oneOf(
            [
              ...countries.map(country => country.cca2),

              // .oneOf() has a weird behavior with .nullable(), see:
              // https://github.com/jquense/yup/issues/104
              null
            ],
            `${verboseFieldName}: Le code ISO 3166-1 alpha-2 du pays de l'entreprise n'est pas reconnu`
          )
          .nullable()
      : Yup.string()
          .oneOf(
            ["FR", null],
            `${verboseFieldName}: Cette entreprise ne peut pas être à l'étranger`
          )
          .nullable(),
    contact: Yup.string().required(
      `${verboseFieldName}: Le contact dans l'entreprise est obligatoire`
    ),
    phone: Yup.string().required(
      `${verboseFieldName}: Le téléphone de l'entreprise est obligatoire`
    ),
    mail: Yup.string().required(
      `${verboseFieldName}: L'email de l'entreprise est obligatoire`
    )
  });

  return schema.validateSync(company);
}

export function validateTransporter(transporter: TransporterInput) {
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

export function validateReceivedInfos(receivedInfo: ReceivedFormInput) {
  if (!isValidDatetime(receivedInfo.receivedAt)) {
    throw new InvalidDateTime("receivedAt");
  }

  if (receivedInfo.signedAt && !isValidDatetime(receivedInfo.signedAt)) {
    throw new InvalidDateTime("signedAt");
  }

  if (receivedInfo.wasteAcceptationStatus === "REFUSED") {
    if (receivedInfo.quantityReceived !== 0) {
      throw new UserInputError(
        "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé"
      );
    }
    if (!receivedInfo.wasteRefusalReason) {
      throw new UserInputError("Vous devez saisir un motif de refus");
    }
  } else if (receivedInfo.wasteAcceptationStatus === "ACCEPTED") {
    if (receivedInfo.quantityReceived <= 0) {
      throw new UserInputError(
        "Vous devez saisir une quantité reçue supérieure à 0."
      );
    }
    if (receivedInfo.wasteRefusalReason) {
      throw new UserInputError(
        "Le champ wasteRefusalReason ne doit pas être renseigné si le déchet est accepté "
      );
    }
  } else if (receivedInfo.wasteAcceptationStatus === "PARTIALLY_REFUSED") {
    if (receivedInfo.quantityReceived <= 0) {
      throw new UserInputError(
        "Vous devez saisir une quantité reçue supérieure à 0."
      );
    }
    if (!receivedInfo.wasteRefusalReason) {
      throw new UserInputError("Vous devez saisir un motif de refus partiel");
    }
  }
  return receivedInfo;
}

/**
 * A form must comply with this schema before it can be sealed or sent
 */
export const sealableFormSchema = Yup.object().shape({
  emitterType: Yup.string().ensure().required(),
  emitterCompanyName: Yup.string()
    .ensure()
    .required("Émetteur: Le nom de l'entreprise est obligatoire"),
  emitterCompanySiret: Yup.string()
    .ensure()
    .required("Émetteur: Le siret de l'entreprise est obligatoire"),
  emitterCompanyAddress: Yup.string()
    .ensure()
    .required("Émetteur: L'adresse de l'entreprise est obligatoire"),
  emitterCompanyContact: Yup.string()
    .ensure()
    .required("Émetteur: Le contact de l'entreprise est obligatoire"),
  emitterCompanyPhone: Yup.string()
    .ensure()
    .required("Émetteur: Le téléphone de l'entreprise est obligatoire"),
  emitterCompanyMail: Yup.string()
    .ensure()
    .required("Émetteur: L'email de l'entreprise est obligatoire"),
  recipientProcessingOperation: Yup.string()
    .label("Opération d’élimination / valorisation")
    .ensure()
    .required(),
  recipientCompanyName: Yup.string()
    .ensure()
    .required("Destinataire: Le nom de l'entreprise est obligatoire"),
  recipientCompanySiret: Yup.string()
    .ensure()
    .required("Destinataire: Le siret de l'entreprise est obligatoire"),
  recipientCompanyAddress: Yup.string()
    .ensure()
    .required("Destinataire: L'adresse de l'entreprise est obligatoire"),
  recipientCompanyContact: Yup.string()
    .ensure()
    .required("Destinataire: Le contact de l'entreprise est obligatoire"),
  recipientCompanyPhone: Yup.string()
    .ensure()
    .required("Destinataire: Le téléphone de l'entreprise est obligatoire"),
  recipientCompanyMail: Yup.string()
    .ensure()
    .required("Destinataire: L'email de l'entreprise est obligatoire"),
  transporterCompanyName: Yup.string()
    .ensure()
    .required("Transporteur: Le nom de l'entreprise est obligatoire"),
  transporterCompanySiret: Yup.string()
    .ensure()
    .required("Transporteur: Le siret de l'entreprise est obligatoire"),
  transporterCompanyAddress: Yup.string()
    .ensure()
    .required("Transporteur: L'adresse de l'entreprise est obligatoire"),
  transporterCompanyContact: Yup.string()
    .ensure()
    .required("Transporteur: Le contact de l'entreprise est obligatoire"),
  transporterCompanyPhone: Yup.string()
    .ensure()
    .required("Transporteur: Le téléphone de l'entreprise est obligatoire"),
  transporterCompanyMail: Yup.string()
    .ensure()
    .required("Transporteur: L'email de l'entreprise est obligatoire"),
  transporterIsExemptedOfReceipt: Yup.boolean().nullable(true),
  transporterReceipt: Yup.string().when(
    "transporterIsExemptedOfReceipt",
    (isExemptedOfReceipt, schema) =>
      isExemptedOfReceipt
        ? schema.nullable(true)
        : schema
            .ensure()
            .required(
              "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
            )
  ),
  transporterDepartment: Yup.string().when(
    "transporterIsExemptedOfReceipt",
    (isExemptedOfReceipt, schema) =>
      isExemptedOfReceipt
        ? schema.nullable(true)
        : schema
            .ensure()
            .required("Le département du transporteur est obligatoire")
  ),
  transporterValidityLimit: validDatetime(
    { verboseFieldName: "date de validité" },
    Yup
  ),
  wasteDetailsCode: Yup.string().oneOf(
    WASTES_CODES,
    "Le code déchet est obligatoire et doit appartenir à la liste  du code de l'environnement (par exemple 16 11 05*)"
  ),
  wasteDetailsOnuCode: Yup.string(),
  wasteDetailsPackagings: Yup.array().ensure().required(),
  wasteDetailsNumberOfPackages: Yup.number()
    .integer()
    .min(1, "Le nombre de colis doit être supérieur à 0")
    .nullable(true),
  wasteDetailsQuantity: Yup.number().min(
    0,
    "La quantité doit être supérieure à 0"
  ),
  wasteDetailsQuantityType: Yup.string()
    .ensure()
    .required("Le type de quantité (réelle ou estimée) doit être précisé"),
  wasteDetailsConsistence: Yup.string()
    .ensure()
    .required("La consistance du déchet doit être précisée"),
  ecoOrganisme: Yup.object()
    .nullable()
    .when("emitterType", {
      is: e => e === "OTHER",
      otherwise: Yup.object()
        .nullable()
        .test(
          "is-not-set",
          "${path} ne peut avoir une valeur que si l'émetteur est de type `Autre détenteur`",
          value => value?.id == null
        )
    }),
  temporaryStorageDetail: Yup.object()
    .nullable()
    .when("recipientIsTempStorage", {
      is: e => e === true,
      otherwise: Yup.object()
        .nullable()
        .test(
          "is-not-set",
          "${path} ne peut avoir une valeur que si recipientIsTempStorage === true",
          value => value?.id == null
        )
    })
});

/**
 * Validate form shape (required fields, values, coherence between fields, etc) before it can be sealed or sent
 */
export async function checkCanBeSealed(form: Form) {
  const ecoOrganisme = await prisma.form({ id: form.id }).ecoOrganisme();
  const temporaryStorageDetail = await prisma
    .form({ id: form.id })
    .temporaryStorageDetail();
  try {
    return sealableFormSchema.validateSync(
      { ...form, ecoOrganisme, temporaryStorageDetail },
      { abortEarly: true }
    );
  } catch (err) {
    if (err.errors && err.errors.length > 0) {
      const stringifiedErrors = err.errors.join("\n");
      throw new UserInputError(
        `Erreur, impossible de sceller le bordereau car des champs obligatoires ne sont pas renseignés.\nErreur(s): ${stringifiedErrors}`
      );
    } else {
      throw err;
    }
  }
}
