import * as Yup from "yup";
import { validDatetime, validCompany } from "./validation-helpers";
import { inputRule } from "graphql-shield";
import countries from "world-countries";
import {
  PROCESSING_OPERATIONS_CODES,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES
} from "../../common/constants";
import { CountryNotFound } from "../errors";

export const getReceivedInfoSchema = yup =>
  yup.object({
    wasteAcceptationStatus: yup
      .string()
      .required()
      .matches(/(ACCEPTED|REFUSED|PARTIALLY_REFUSED)/, {
        message: "Vous devez préciser si vous acceptez ou non le déchet."
      }),
    receivedBy: yup
      .string()
      .required("Vous devez saisir un responsable de la réception."),
    receivedAt: validDatetime(
      {
        verboseFieldName: "date de réception",
        required: true
      },
      yup
    ),
    signedAt: validDatetime(
      {
        verboseFieldName: "date d'acceptation"
      },
      yup
    ),

    quantityReceived: yup
      .number()
      .required()
      // if waste is refused, quantityReceived must be 0
      .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
        ["REFUSED"].includes(wasteAcceptationStatus)
          ? schema.test(
              "is-zero",
              "Vous devez saisir une quantité reçue égale à 0.",
              v => v === 0
            )
          : schema
      )
      // if waste is partially or totally accepted, we check it is a positive value
      .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
        ["ACCEPTED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
          ? schema.test(
              "is-strictly-positive",
              "Vous devez saisir une quantité reçue supérieure à 0.",
              v => v > 0
            )
          : schema
      ),
    wasteRefusalReason: yup
      .string()
      .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
        ["REFUSED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
          ? schema.required()
          : schema.test(
              "is-empty",
              "Le champ wasteRefusalReason ne doit pas être rensigné si le déchet est accepté ",
              v => !v
            )
      )
  });

export const markAsSentSchema = inputRule()(
  yup =>
    yup.object().shape({
      sentInfo: yup.object({
        sentAt: validDatetime(
          {
            verboseFieldName: "date d'envoi",
            required: true
          },
          yup
        ),
        sentBy: yup
          .string()
          .required("Vous devez saisir un responsable de l'envoi.")
      })
    }),
  {
    abortEarly: false
  }
);

export const markAsReceivedSchema = inputRule()(
  yup =>
    yup.object().shape({
      receivedInfo: getReceivedInfoSchema(yup)
    }),
  {
    abortEarly: false
  }
);

export const markAsProcessedSchema = inputRule()(
  yup =>
    yup.object().shape({
      processedInfo: yup.object({
        processingOperationDone: yup
          .mixed()
          .oneOf(
            PROCESSING_OPERATIONS_CODES,
            "Cette opération d’élimination / valorisation n'existe pas."
          ),
        processingOperationDescription: yup.string(),
        processedBy: yup
          .string()
          .required("Vous devez saisir un responsable de traitement."),
        processedAt: validDatetime(
          {
            verboseFieldName: "date de traitement",
            required: true
          },
          yup
        ),
        nextDestination: yup.object().when("processingOperationDone", {
          is: val => PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(val),
          then: yup.object({
            processingOperation: yup.string(),
            company: validCompany({
              verboseFieldName: "Destination ultérieure prévue"
            })
          })
        }),
        noTraceability: yup.boolean().nullable(true)
      })
    }),
  {
    abortEarly: false
  }
);

export const signedByTransporterSchema = inputRule()(
  yup =>
    yup.object().shape({
      signingInfo: yup.object({
        sentAt: validDatetime(
          {
            verboseFieldName: "date d'envoi",
            required: true
          },
          yup
        ),
        signedByTransporter: yup
          .boolean()
          .required("Vous devez indiquer si le transporteur a signé.")
          .oneOf(
            [true],
            "Le transporteur doit signer pour valider l'enlèvement."
          ),
        securityCode: yup.number().nullable(true),
        sentBy: yup
          .string()
          .required("Vous devez saisir un responsable de l'envoi."),
        signedByProducer: yup
          .boolean()
          .required("Vous devez indiquer si le producteur a signé.")
          .oneOf(
            [true],
            "Le producteur doit signer pour valider l'enlèvement."
          ),

        packagings: yup
          .array()
          .of(yup.string().matches(/(FUT|GRV|CITERNE|BENNE|AUTRE)/)),
        quantity: yup
          .number()
          .positive("Vous devez saisir une quantité envoyée supérieure à 0."),
        onuCode: yup.string().nullable(true)
      })
    }),
  {
    abortEarly: false
  }
);

export const markAsTempStoredSchema = inputRule()(
  yup =>
    yup.object().shape({
      tempStoredInfos: getReceivedInfoSchema(yup)
    }),
  {
    abortEarly: false
  }
);

export const markAsResealedSchema = inputRule()(
  yup =>
    yup.object().shape({
      resealedInfos: yup.object({
        wasteDetails: yup.object({}),
        transporter: yup.object({
          isExemptedOfReceipt: yup.boolean().nullable(true),
          receipt: yup
            .string()
            .when("isExemptedOfReceipt", (isExemptedOfReceipt, schema) =>
              isExemptedOfReceipt
                ? schema.nullable(true)
                : schema.required(
                    "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
                  )
            ),
          department: yup
            .string()
            .when("isExemptedOfReceipt", (isExemptedOfReceipt, schema) =>
              isExemptedOfReceipt
                ? schema.nullable(true)
                : schema.required(
                    "Le département du transporteur est obligatoire"
                  )
            ),
          validityLimit: validDatetime(
            {
              verboseFieldName: "date de validité"
            },
            yup
          ),
          numberPlate: yup.string().nullable(true),
          company: validCompany({ verboseFieldName: "Transporteur" })
        })
      })
    }),
  {
    abortEarly: false
  }
);

/**
 * The destination is optionnal in the `markAsResealed` and `markAsResend` mutations if it has already been filled.
 */
export const temporaryStorageDestinationSchema = inputRule()(yup =>
  yup.object({
    resentInfos: yup.object({
      destination: yup.object({
        company: validCompany({ verboseFieldName: "Destinataire du BSD" }),
        processingOperation: yup
          .mixed()
          .oneOf(
            PROCESSING_OPERATIONS_CODES,
            "Cette opération d’élimination / valorisation n'existe pas."
          ),
        cap: yup.string().nullable(true)
      })
    })
  })
);

export const markAsResentSchema = inputRule()(
  yup =>
    yup.object().shape({
      resentInfos: yup.object({
        wasteDetails: yup.object({}),
        transporter: yup.object({
          isExemptedOfReceipt: yup.boolean().nullable(true),
          receipt: yup
            .string()
            .when("isExemptedOfReceipt", (isExemptedOfReceipt, schema) =>
              isExemptedOfReceipt
                ? schema.nullable(true)
                : schema.required(
                    "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
                  )
            ),
          department: yup
            .string()
            .when("isExemptedOfReceipt", (isExemptedOfReceipt, schema) =>
              isExemptedOfReceipt
                ? schema.nullable(true)
                : schema.required(
                    "Le département du transporteur est obligatoire"
                  )
            ),
          validityLimit: validDatetime(
            {
              verboseFieldName: "date de validité"
            },
            yup
          ),
          numberPlate: yup.string().nullable(true),
          company: validCompany({ verboseFieldName: "Transporteur" })
        }),
        signedBy: yup
          .string()
          .required("Vous devez saisir un responsable de l'envoi."),
        signedAt: validDatetime(
          {
            verboseFieldName: "une date d'envoi",
            required: true
          },
          yup
        )
      })
    }),
  {
    abortEarly: false
  }
);

export const formsSchema = inputRule()(yup =>
  yup.object({
    siret: yup.string().nullable(),
    first: yup.number().lessThan(501).moreThan(0).nullable(),
    skip: yup.number().moreThan(0).nullable(),
    status: yup.array().of(yup.string()).nullable(),
    roles: yup
      .array()
      .of(
        yup
          .string()
          .oneOf([
            "TRANSPORTER",
            "RECIPIENT",
            "EMITTER",
            "TRADER",
            "ECO_ORGANISME",
            "TEMPORARY_STORER"
          ])
      )
      .nullable()
  })
);

export const segmentSchema = Yup.object<any>().shape({
  // id: Yup.string().label("Identifiant (id)").required(),
  mode: Yup.string().label("Mode de transport").required(),
  transporterCompanySiret: Yup.string()
    .label("Siret du transporteur")
    .required("La sélection d'une entreprise est obligatoire"),
  transporterCompanyAddress: Yup.string().required(),
  transporterCompanyContact: Yup.string().required(
    "Le contact dans l'entreprise est obligatoire"
  ),
  transporterCompanyPhone: Yup.string().required(
    "Le téléphone de l'entreprise est obligatoire"
  ),
  transporterCompanyMail: Yup.string()
    .email("Le format d'adresse email est incorrect")
    .required("L'email est obligatoire"),
  transporterIsExemptedOfReceipt: Yup.boolean().nullable(true),
  transporterReceipt: Yup.string().when(
    "transporterIsExemptedOfReceipt",
    (isExemptedOfReceipt, schema) =>
      isExemptedOfReceipt
        ? schema.nullable(true)
        : schema.required(
            "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
          )
  ),
  transporterDepartment: Yup.string().when(
    "transporterIsExemptedOfReceipt",
    (isExemptedOfReceipt, schema) =>
      isExemptedOfReceipt
        ? schema.nullable(true)
        : schema.required("Le département du transporteur est obligatoire")
  ),

  transporterValidityLimit: validDatetime(
    {
      verboseFieldName: "date de validité"
    },
    Yup
  ),
  transporterNumberPlate: Yup.string().nullable(true)
});

export const takeOverInfoSchema = Yup.object<any>().shape({
  takenOverAt: validDatetime(
    {
      verboseFieldName: "date de prise en charge",
      required: true
    },
    Yup
  ),
  takenOverBy: Yup.string().required("Le nom du responsable est obligatoire")
});

export const formsRegisterSchema = inputRule()(yup =>
  yup.object().shape({
    sirets: yup.array(yup.string()).required(),
    exportType: yup.string(),
    startDate: validDatetime(
      {
        verboseFieldName: "Date de début",
        required: false
      },
      yup
    ),
    endDate: validDatetime(
      {
        verboseFieldName: "Date de début",
        required: false
      },
      yup
    ),
    exportFormat: yup.string()
  })
);
