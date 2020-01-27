import { object, date, string, boolean, number, array } from "yup";

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
    // if waste is refused, we set quantityReceived to 0
    .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
      ["REFUSED"].includes(wasteAcceptationStatus)
        ? schema.transform(v => 0)
        : schema
    )
    // if waste is partially or totally accepted, we check it is a positive value
    .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
      ["ACCEPTED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
        ? schema.test(
            "is-positive-or-zero",
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
        processingOperationDone: string().matches(
          /(R|D)\s\d{1,2}/,
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
        nextDestinationProcessingOperation: string().nullable(true),
        nextDestinationDetails: string().nullable(true),
        noTraceability: boolean().nullable(true)
      })
    }),
    signedByTransporter: object().shape({
      signingInfo: object({
        sentAt: date().required("Vous devez saisir une date d'envoi."),
        signedByTransporter: boolean().required(
          "Voud devez indiquer si le transporteur a signé."
        ),
        securityCode: number().nullable(true),
        sentBy: string().required(
          "Vous devez saisir un responsable de l'envoi."
        ),
        signedByProducer: boolean().required(
          "Voud devez indiquer si le producteur a signé."
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
