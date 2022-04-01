import { TemporaryStorageDetail } from "@prisma/client";
import prisma from "../../../prisma";
import {
  Form,
  FormResolvers,
  PackagingInfo
} from "../../../generated/graphql/types";

function getTransporter(
  form: Form,
  temporaryStorageDetail: TemporaryStorageDetail
) {
  if (["SEALED", "DRAFT"].includes(form.status)) {
    return form.transporter?.company;
  }

  if (
    temporaryStorageDetail &&
    ["RESEALED", "TEMP_STORED", "TEMP_STORER_ACCEPTED"].includes(form.status)
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
    !["DRAFT", "SENT", "SEALED"].includes(form.status)
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
    ["TEMP_STORED", "TEMP_STORER_ACCEPTED", "RESEALED"].includes(form.status)
  ) {
    return form.recipient?.company;
  }

  return form.emitter?.company;
}

function getLastActionOn(
  form: Form,
  temporaryStorageDetail: TemporaryStorageDetail
): Date {
  switch (form.status) {
    case "SENT":
      return form.sentAt;
    case "RECEIVED":
    case "ACCEPTED":
      return form.receivedAt;
    case "PROCESSED":
      return form.processedAt;
    case "TEMP_STORED":
    case "TEMP_STORER_ACCEPTED":
    case "RESEALED":
      return temporaryStorageDetail.tempStorerReceivedAt;
    case "RESENT":
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

export async function getStateSummary(form: Form) {
  const temporaryStorageDetail = await prisma.form
    .findUnique({ where: { id: form.id } })
    .temporaryStorageDetail();

  const packagingInfos =
    temporaryStorageDetail?.wasteDetailsPackagingInfos &&
    (temporaryStorageDetail?.wasteDetailsPackagingInfos as PackagingInfo[])
      .length > 0
      ? (temporaryStorageDetail?.wasteDetailsPackagingInfos as PackagingInfo[])
      : form.wasteDetails?.packagingInfos ?? [];

  return {
    quantity: getQuantity(form, temporaryStorageDetail),
    packagingInfos,
    packagings: packagingInfos.map(pi => pi.type),
    onuCode:
      temporaryStorageDetail?.wasteDetailsOnuCode ?? form.wasteDetails?.onuCode,
    transporterNumberPlate:
      temporaryStorageDetail?.transporterNumberPlate ??
      form.transporter?.numberPlate,
    transporterCustomInfo:
      temporaryStorageDetail?.transporterCustomInfo ??
      form.transporter?.customInfo,
    transporter: getTransporter(form, temporaryStorageDetail),
    recipient: getRecipient(form, temporaryStorageDetail),
    emitter: getEmitter(form, temporaryStorageDetail),
    lastActionOn: getLastActionOn(form, temporaryStorageDetail)
  };
}

const stateSummaryResolver: FormResolvers["stateSummary"] = form => {
  return getStateSummary(form);
};

export default stateSummaryResolver;
