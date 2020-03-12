import { object, date, string, boolean, number, array, mixed } from "yup";
import { companySchema } from "./validator";
import { GROUP_CODES } from "./workflow/machine";
export const GROUP_COsDES = ["D 13", "D 14", "D 15", "R 13"];
["D 13", "D 14", "D 15", "R 12", "R 13"]
const PROCESSING_OPERATION_CODES = [
  "D 1",
  "D 2",
  "D 3",
  "D 4",
  "D 5",
  "D 6",
  "D 7",
  "D 8",
  "D 9",
  "D 10",
  "D 11",
  "D 12",
  "D 13",
  "D 14",
  "D 15",
  "R 1",
  "R 2",
  "R 3",
  "R 4",
  "R 5",
  "R 6",
  "R 7",
  "R 8",
  "R 9",
  "R 10",
  "R 11",
  "R 12",
  "R 13"
];
export const receivedInfoSchema = object({
  wasteAcceptationStatus: string()
    .required()
    .matches(/(ACCEPTED|REFUSED|PARTIALLY_REFUSED)/, {
      message: "Vous devez préciser si vous acceptez ou non le déchet."
    }),
  receivedBy: string().required(
    "Vous devez saisir un responsable de la réception."
  ),
  receivedAt: date().required("Vous devez saisir une date de réception."),

  quantityReceived: number()
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
  wasteRefusalReason: string().when(
    "wasteAcceptationStatus",
    (wasteAcceptationStatus, schema) =>
      ["REFUSED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
        ? schema.required()
        : schema.test(
            "is-empty",
            "Le champ wasteRefusalReason ne doit pas être rensigné si le déchet est accepté ",
            v => !v
          )
  )
});

export default {
  Mutation: {
    markAsSent: object().shape({
      sentInfo: object({
        sentAt: date().required("Vous devez saisir une date d'envoi."),
        sentBy: string().required(
          "Vous devez saisir un responsable de l'envoi."
        )
      })
    }),
    markAsReceived: object().shape({
      receivedInfo: receivedInfoSchema
    }),
    markAsProcessed: object().shape({
      processedInfo: object({
         processingOperationDone: mixed().oneOf(
          PROCESSING_OPERATION_CODES,
          "Cette opération de traitement n'existe pas."
        ),
        processingOperationDescription: string().required(
          "Vous devez renseigner la description de l'opération."
        ),
        processedBy: string().required(
          "Vous devez saisir un responsable de traitement."
        ),
        processedAt: date().required(
          "Vous devez saisir la date de traitement."
        ),
        nextDestination: object().when("processingOperationDone", {
          is: val => GROUP_CODES.includes(val),
          then: object({
            processingOperation: string(),
            company: companySchema("Destination ultérieure prévue")
          })
        }),
        noTraceability: boolean().nullable(true)
      })
    }),
    signedByTransporter: object().shape({
      signingInfo: object({
        sentAt: date().required("Vous devez saisir une date d'envoi."),
        signedByTransporter: boolean()
          .required("Vous devez indiquer si le transporteur a signé.")
          .oneOf(
            [true],
            "Le transporteur doit signer pour valider l'enlèvement."
          ),
        securityCode: number().nullable(true),
        sentBy: string().required(
          "Vous devez saisir un responsable de l'envoi."
        ),
        signedByProducer: boolean()
          .required("Vous devez indiquer si le producteur a signé.")
          .oneOf(
            [true],
            "Le producteur doit signer pour valider l'enlèvement."
          ),

        packagings: array().of(
          string().matches(/(FUT|GRV|CITERNE|BENNE|AUTRE)/)
        ),
        quantity: number().positive(
          "Vous devez saisir une quantité envoyée supérieure à 0."
        ),
        onuCode: string().required("Vous devez saisir un code ONU.")
      })
    })
  }
};
