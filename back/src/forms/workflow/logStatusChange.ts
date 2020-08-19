import { GraphQLContext } from "../../types";
import { prisma } from "../../generated/prisma-client";

const fieldsToLog = {
  MARK_SEALED: [],
  MARK_SENT: ["sentBy", "sentAt"],
  MARK_SIGNED_BY_TRANSPORTER: [
    "sentAt",
    "signedByTransporter",
    "sentBy",
    "signedByProducer",
    "packagings",
    "quantity",
    "onuCode"
  ],
  MARK_RECEIVED: ["receivedBy", "receivedAt", "signedAt", "quantityReceived"],
  MARK_PROCESSED: [
    "processedBy",
    "processedAt",
    "processingOperationDone",
    "processingOperationDescription",
    "noTraceability",
    "nextDestinationProcessingOperation",
    "nextDestinationDetails",
    "nextDestinationCompanyName",
    "nextDestinationCompanySiret",
    "nextDestinationCompanyAddress",
    "nextDestinationCompanyContact",
    "nextDestinationCompanyPhone",
    "nextDestinationCompanyMail"
  ],
  MARK_TEMP_STORED: [
    "receivedBy",
    "receivedAt",
    "signedAt",
    "quantityReceived",
    "quantityType"
  ],
  MARK_RESEALED: [
    "destinationIsFilledByEmitter",
    "destinationCompanyName",
    "destinationCompanySiret",
    "destinationCompanyAddress",
    "destinationCompanyContact",
    "destinationCompanyPhone",
    "destinationCompanyMail",
    "destinationCap",
    "destinationProcessingOperation",
    "wasteDetailsOnuCode",
    "wasteDetailsPackagings",
    "wasteDetailsOtherPackaging",
    "wasteDetailsNumberOfPackages",
    "wasteDetailsQuantity",
    "wasteDetailsQuantityType"
  ],
  MARK_RESENT: [
    "destinationIsFilledByEmitter",
    "destinationCompanyName",
    "destinationCompanySiret",
    "destinationCompanyAddress",
    "destinationCompanyContact",
    "destinationCompanyPhone",
    "destinationCompanyMail",
    "destinationCap",
    "destinationProcessingOperation",
    "signedBy",
    "signedAt",
    "wasteDetailsOnuCode",
    "wasteDetailsPackagings",
    "wasteDetailsOtherPackaging",
    "wasteDetailsNumberOfPackages",
    "wasteDetailsQuantity",
    "wasteDetailsQuantityType"
  ]
};

const getSubset = fields => o =>
  fields.reduce((acc, curr) => ({ ...acc, [curr]: o[curr] }), {});

const getDiff = (eventType, params) => {
  if (!eventType) {
    return {};
  }
  const fields = fieldsToLog[eventType];
  return getSubset(fields)(params);
};
export default function (
  formId,
  status,
  context: GraphQLContext,
  eventType: string,
  eventParams: any
) {
  const diff = getDiff(eventType, eventParams);

  return prisma
    .createStatusLog({
      form: { connect: { id: formId } },
      user: { connect: { id: context.user.id } },
      status,
      loggedAt: new Date(),
      updatedFields: diff
    })
    .catch(err => {
      console.error(
        `Cannot log status change for form ${formId}, user ${context.user.id}, status ${status}`,
        err
      );
      throw new Error("Problème technique, merci de réessayer plus tard.");
    });
}
