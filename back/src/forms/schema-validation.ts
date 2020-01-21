import { object, date, string, boolean, number, array } from "yup";

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
      receivedInfo: object({
        isAccepted: boolean().required(
          "Vous devez préciser si vous acceptez ou non le déchet."
        ),
        receivedBy: string().required(
          "Vous devez saisir un responsable de la réception."
        ),
        receivedAt: date().required("Vous devez saisir une date de réception."),
        quantityReceived: number().positive(
          "Vous devez saisir une quantité reçue supérieure à 0."
        )
      })
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
