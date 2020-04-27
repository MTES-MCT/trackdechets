import { GraphQLContext } from "../../types";
import { TemporaryStorageDetail } from "../../generated/prisma-client";
import { Form, FormStatus } from "../../generated/types";

export const stateSummary = async (
  parent: Form,
  _,
  context: GraphQLContext
) => {
  const temporaryStorageDetail = await context.prisma
    .form({ id: parent.id })
    .temporaryStorageDetail();

  return {
    quantity: getQuantity(parent, temporaryStorageDetail),
    transporter: getTransporter(parent, temporaryStorageDetail),
    recipient: getRecipient(parent, temporaryStorageDetail),
    emitter: getEmitter(parent, temporaryStorageDetail),
    lastActionOn: getLastActionOn(parent, temporaryStorageDetail)
  };
};

function getTransporter(
  form: Form,
  temporaryStorageDetail: TemporaryStorageDetail
) {
  if ([FormStatus.Sealed, FormStatus.Draft].includes(form.status)) {
    return form.transporter?.company;
  }

  if (
    temporaryStorageDetail &&
    [FormStatus.Resealed, FormStatus.TempStored].includes(form.status)
  ) {
    return {
      name: temporaryStorageDetail.transporterCompanyName,
      siret: temporaryStorageDetail.transporterCompanySiret,
      address: temporaryStorageDetail.transporterCompanyAddress,
      contact: temporaryStorageDetail.transporterCompanyContact,
      phone: temporaryStorageDetail.transporterCompanyPhone,
      mail: temporaryStorageDetail.transporterCompanyMail
    };
  }

  return null;
}

function getRecipient(
  form: Form,
  temporaryStorageDetail: TemporaryStorageDetail
) {
  if (
    temporaryStorageDetail &&
    ![FormStatus.Draft, FormStatus.Sent].includes(form.status)
  ) {
    return {
      name: temporaryStorageDetail.destinationCompanyName,
      siret: temporaryStorageDetail.destinationCompanySiret,
      address: temporaryStorageDetail.destinationCompanyAddress,
      contact: temporaryStorageDetail.destinationCompanyContact,
      phone: temporaryStorageDetail.destinationCompanyPhone,
      mail: temporaryStorageDetail.destinationCompanyMail
    };
  }

  return form.recipient?.company;
}

function getEmitter(
  form: Form,
  temporaryStorageDetail: TemporaryStorageDetail
) {
  if (
    temporaryStorageDetail &&
    [FormStatus.TempStored, FormStatus.Resealed].includes(form.status)
  ) {
    return form.recipient?.company;
  }

  return form.emitter?.company;
}

function getLastActionOn(
  form: Form,
  temporaryStorageDetail: TemporaryStorageDetail
): string {
  switch (form.status) {
    case FormStatus.Sent:
      return form.sentAt;
    case FormStatus.Received:
      return form.receivedAt;
    case FormStatus.Processed:
      return form.processedAt;
    case FormStatus.TempStored:
    case FormStatus.Resealed:
      return temporaryStorageDetail.tempStorerReceivedAt;
    case FormStatus.Resent:
      return temporaryStorageDetail.signedAt;
    default:
      return form.createdAt;
  }
}

function getQuantity(
  form: Form,
  temporaryStorageDetail: TemporaryStorageDetail
): number | null {
  // When the form is received we have the definitive quantity
  if (form.quantityReceived != null) {
    return form.quantityReceived;
  }
  // When form is temp stored the quantity is reported on arrival and might be changed
  if (form.recipient?.isTempStorage) {
    // Repackaging
    if (temporaryStorageDetail?.wasteDetailsQuantity) {
      return temporaryStorageDetail.wasteDetailsQuantity;
    }

    // Arrival
    if (temporaryStorageDetail?.tempStorerQuantityReceived != null) {
      return temporaryStorageDetail.tempStorerQuantityReceived;
    }
  }
  // Not a lot happened yet, use the quantity input
  if (form.wasteDetails?.quantity) {
    return form.wasteDetails.quantity;
  }
  // For drafts, we might not have a quantity yet
  return null;
}
