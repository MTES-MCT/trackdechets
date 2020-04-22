import { validDatetime, validCompany } from "./validation-helpers";
import { inputRule } from "graphql-shield";
import {
  PROCESSING_OPERATION_CODES,
  GROUP_CODES
} from "../../common/constants";

export const receivedInfoSchema = yup =>
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

export const markAsSentSchema = inputRule()(yup =>
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
  })
);

export const markAsReceivedSchema = inputRule()(yup =>
  yup.object().shape({
    receivedInfo: receivedInfoSchema(yup)
  })
);

export const markAsProcessedSchema = inputRule()(yup =>
  yup.object().shape({
    processedInfo: yup.object({
      processingOperationDone: yup
        .mixed()
        .oneOf(
          PROCESSING_OPERATION_CODES,
          "Cette opération de traitement n'existe pas."
        ),
      processingOperationDescription: yup
        .string()
        .required("Vous devez renseigner la description de l'opération."),
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
        is: val => GROUP_CODES.includes(val),
        then: yup.object({
          processingOperation: yup.string(),
          company: validCompany(
            { verboseFieldName: "Destination ultérieure prévue" },
            yup
          )
        })
      }),
      noTraceability: yup.boolean().nullable(true)
    })
  })
);

export const signedByTransporterSchema = inputRule()(yup =>
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
        .oneOf([true], "Le producteur doit signer pour valider l'enlèvement."),

      packagings: yup
        .array()
        .of(yup.string().matches(/(FUT|GRV|CITERNE|BENNE|AUTRE)/)),
      quantity: yup
        .number()
        .positive("Vous devez saisir une quantité envoyée supérieure à 0."),
      onuCode: yup.string().nullable(true)
    })
  })
);

export const markAsTempStoredSchema = inputRule()(yup =>
  yup.object().shape({
    tempStoredInfos: yup.object({
      wasteAcceptationStatus: yup
        .string()
        .required()
        .matches(/(ACCEPTED|REFUSED|PARTIALLY_REFUSED)/, {
          message: "Vous devez préciser si vous acceptez ou non le déchet."
        }),
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
        ),
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
      quantityType: yup
        .string()
        .matches(
          /(REAL|ESTIMATED)/,
          "Le type de quantité (réelle ou estimée) doit être précisé"
        )
    })
  })
);

export const markAsResealedSchema = inputRule()(yup =>
  yup.object().shape({
    resealedInfos: yup.object({
      destination: yup.object({
        company: validCompany({ verboseFieldName: "Destinataire du BSD" }, yup),
        processingOperation: yup
          .mixed()
          .oneOf(
            PROCESSING_OPERATION_CODES,
            "Cette opération de traitement n'existe pas."
          ),
        cap: yup.string().nullable(true)
      }),
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
        company: validCompany({ verboseFieldName: "Transporteur" }, yup)
      })
    })
  })
);

export const markAsResentSchema = inputRule()(yup =>
  yup.object().shape({
    resentInfos: yup.object({
      destination: yup.object({
        company: validCompany({ verboseFieldName: "Destinataire du BSD" }, yup),
        processingOperation: yup
          .mixed()
          .oneOf(
            PROCESSING_OPERATION_CODES,
            "Cette opération de traitement n'existe pas."
          ),
        cap: yup.string().nullable(true)
      }),
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
        company: validCompany({ verboseFieldName: "Transporteur" }, yup)
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
  })
);
