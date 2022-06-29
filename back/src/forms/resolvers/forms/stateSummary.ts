import { Status } from "@prisma/client";
import {
  Form,
  FormResolvers,
  TemporaryStorageDetail
} from "../../../generated/graphql/types";

function getLastActionOn(
  form: Form,
  temporaryStorageDetail: TemporaryStorageDetail
): Date {
  switch (form.status) {
    case "SENT":
      return form.takenOverAt;
    case "RECEIVED":
    case "ACCEPTED":
      return form.receivedAt;
    case "PROCESSED":
      return form.processedAt;
    case "TEMP_STORED":
    case "TEMP_STORER_ACCEPTED":
    case "RESEALED":
      return temporaryStorageDetail?.temporaryStorer?.receivedAt;
    case "RESENT":
      return temporaryStorageDetail.takenOverAt;
    default:
      return form.createdAt;
  }
}

export async function getStateSummary(form: Form) {
  const { temporaryStorageDetail } = form;

  // This boolean is true when a form with temporary
  // storage has been resealed or resent
  const isResealed =
    form.recipient?.isTempStorage &&
    !!temporaryStorageDetail &&
    (form.status === Status.RESEALED ||
      !!form.temporaryStorageDetail?.emittedAt);

  const quantity =
    form.quantityReceived ??
    ([Status.TEMP_STORED, Status.TEMP_STORER_ACCEPTED].includes(
      form.status as any
    )
      ? form.temporaryStorageDetail?.temporaryStorer?.quantityReceived
      : isResealed
      ? form.temporaryStorageDetail?.wasteDetails?.quantity
      : form.wasteDetails?.quantity);

  const onuCode = isResealed
    ? form.temporaryStorageDetail?.wasteDetails?.onuCode
    : form.wasteDetails?.onuCode;

  const packagingInfos =
    (isResealed
      ? form.temporaryStorageDetail?.wasteDetails?.packagingInfos
      : form.wasteDetails?.packagingInfos) ?? [];

  const transporter = isResealed
    ? {
        transporterNumberPlate:
          form.temporaryStorageDetail?.transporter?.numberPlate,
        transporterCustomInfo:
          form.temporaryStorageDetail?.transporter?.customInfo,
        transporter: form.temporaryStorageDetail?.transporter?.company
      }
    : {
        transporterNumberPlate: form.transporter?.numberPlate,
        transporterCustomInfo: form.transporter?.customInfo,
        transporter: form.transporter?.company
      };

  const recipient = isResealed
    ? form.temporaryStorageDetail?.destination?.company
    : form.recipient?.company;

  const emitter = isResealed ? form.recipient?.company : form.emitter?.company;

  return {
    quantity,
    packagingInfos,
    packagings: packagingInfos.map(pi => pi.type),
    onuCode,
    ...transporter,
    recipient,
    emitter,
    lastActionOn: getLastActionOn(form, temporaryStorageDetail)
  };
}

const stateSummaryResolver: FormResolvers["stateSummary"] = form => {
  return getStateSummary(form);
};

export default stateSummaryResolver;
