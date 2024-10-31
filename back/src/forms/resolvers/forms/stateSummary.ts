import { QuantityType, Status } from "@prisma/client";
import {
  Form,
  FormResolvers,
  TemporaryStorageDetail
} from "../../../generated/graphql/types";
import { isDefined } from "../../../common/helpers";

function getLastActionOn(
  form: Form,
  temporaryStorageDetail: TemporaryStorageDetail | null | undefined
): Date {
  switch (form.status) {
    case "SENT":
      return form.takenOverAt!;
    case "RECEIVED":
    case "ACCEPTED":
      return form.receivedAt!;
    case "PROCESSED":
      return form.processedAt!;
    case "TEMP_STORED":
    case "TEMP_STORER_ACCEPTED":
    case "RESEALED":
      if (temporaryStorageDetail) {
        /** QUICK FIX
         *
         * `getLastActionOn` may be called in the resolver of a BSDD computed in the FormRevisionRequest resolver.
         * The BSDD is supposed to reflect the state of the BSDD at the time the form revision request was created
         * thanks to the function `getBsddFromActivityEvents`.
         * The problem is that `getBsddFromActivityEvents` is not able to compute the state of dependant
         * objects like `forwardedIn`. The value of `forwardedIn` is thus injected from PostgreSQL (see FormRevisionRequest.ts).
         * The result is a BSDD whose state is in between two states.
         * If a revision request is made when the status of the BSDD is `TEMP_STORED` or `TEMP_STORED_ACCEPTED` and if
         * an anticipated treatment is done on the BSDD (see https://github.com/MTES-MCT/trackdechets/pull/1449), it is possible
         * to have here a virtual BSDD whose status is `TEMP_STORED` or `TEMP_STORER_ACCEPTED` but with no temporaryStorageDetail
         * associated.
         *
         * A proper fix will be to enhance `getBsddFromActivityEvents`to be able to compute a bsdd AND related objects like
         * `forwardedIn` from events.
         */
        return temporaryStorageDetail.temporaryStorer!.receivedAt!;
      }
      return form.receivedAt!;
    case "RESENT":
      return temporaryStorageDetail!.takenOverAt!;
    default:
      return form.createdAt!;
  }
}

export function getStateSummary(form: Form) {
  const { temporaryStorageDetail } = form;

  // This boolean is true when a form with temporary
  // storage has been resealed or resent
  const isResealed =
    form.recipient?.isTempStorage &&
    !!temporaryStorageDetail &&
    (form.status === Status.RESEALED ||
      !!form.temporaryStorageDetail?.emittedAt);

  // Quantity & quantity type
  let quantity: number | undefined | null;
  let quantityType: QuantityType | undefined | null = QuantityType.REAL;
  if (isDefined(form.quantityReceived)) {
    quantity = form.quantityAccepted ?? form.quantityReceived;
    quantityType = form.quantityReceivedType ?? QuantityType.REAL;
  } else {
    if (
      [Status.TEMP_STORED, Status.TEMP_STORER_ACCEPTED].includes(
        form.status as any
      )
    ) {
      quantity =
        form.temporaryStorageDetail?.temporaryStorer?.quantityAccepted ??
        form.temporaryStorageDetail?.temporaryStorer?.quantityReceived;
      quantityType =
        form.temporaryStorageDetail?.temporaryStorer?.quantityType ??
        QuantityType.REAL;
    } else if (isResealed) {
      quantity = form.temporaryStorageDetail?.wasteDetails?.quantity;
      quantityType =
        form.temporaryStorageDetail?.wasteDetails?.quantityType ??
        QuantityType.REAL;
    } else {
      quantity = form.wasteDetails?.quantity;
      quantityType = form.wasteDetails?.quantityType ?? QuantityType.REAL;
    }
  }

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

  const isSubjectToADR = isResealed
    ? form.temporaryStorageDetail?.wasteDetails?.isSubjectToADR
    : form.wasteDetails?.isSubjectToADR;

  return {
    quantity,
    quantityType,
    packagingInfos,
    packagings: packagingInfos.map(pi => pi.type),
    isSubjectToADR,
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
