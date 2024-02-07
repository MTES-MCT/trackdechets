import {
  Broker,
  Bsda,
  BsdaPackagingType,
  BsdaRevisionRequest,
  BsdaRevisionRequestApproval,
  Form,
  FormCompany,
  FormRevisionRequest,
  FormRevisionRequestApproval,
  Maybe,
  RevisionRequestStatus,
  Trader
} from "@td/codegen-ui";
import { getOperationModeLabel } from "../../../../common/operationModes";
import { getPackagingInfosSummary } from "../../../../form/bsdd/utils/packagings";
import {
  BIGBAG,
  BOOLEAN_FALSE_LABEL,
  BOOLEAN_TRUE_LABEL,
  CONTENEUR_BAG,
  DEPOT_BAG,
  OTHER,
  PALETTE_FILME,
  SAC_RENFORCE
} from "./wordingsRevision";

export enum DataNameEnum {
  ADRESS_COLLECT = "Adresse de collecte",
  WASTE_CODE = "Code déchet",
  POP = "Pop",
  WASTE_DESC = "Description déchet",
  SEALED_NUMBER = "Numéros de scellés",
  PACKAGING = "Conditionnement",
  POLLUANTS_ORG = "Présence de polluants organiques persistants",
  CAP_FINAL_DEST = "CAP (destination finale)",
  CAP = "CAP",
  CAP_TEMP_STORAGE = "CAP (entreposage provisoire ou reconditionnement)",
  QTY_RECEIVED = "Quantité reçue (tonnes)",
  QTY_PROCESSED = "Quantité traitée (en tonnes)",
  QTY_RECEIVED_TEMP_STORAGE = "Quantité reçue sur l'installation d'entreposage provisoire ou reconditionnement (tonnes)",
  OPERATION_CODE = "Code d'opération réalisée",
  OPERATION_DONE = "Opération réalisée",
  OPERATION_DONE_DESC = "Description de l'opération réalisée",
  BROKER = "Courtier",
  TRADER = "Négociant"
}
export interface ReviewDetailInterface {
  dataName: DataNameEnum;
  dataOldValue:
    | string
    | Maybe<string>
    | number
    | Maybe<Broker>
    | Maybe<Trader>
    | undefined;
  dataNewValue:
    | string
    | Maybe<string>
    | number
    | Maybe<Broker>
    | Maybe<Trader>
    | undefined;
}
export interface ReviewInterface {
  id: string;
  readableId: string;
  createdAt: string;
  status: RevisionRequestStatus;
  isCanceled: Maybe<boolean> | undefined;
  authoringCompany: FormCompany;
  approvals:
    | Array<BsdaRevisionRequestApproval>
    | Array<FormRevisionRequestApproval>;
  comment: string;
  bsdContent: Form | Bsda;
  details: ReviewDetailInterface[];
}

const PACKAGINGS_NAMES = {
  [BsdaPackagingType.BigBag]: BIGBAG,
  [BsdaPackagingType.DepotBag]: DEPOT_BAG,
  [BsdaPackagingType.PaletteFilme]: PALETTE_FILME,
  [BsdaPackagingType.SacRenforce]: SAC_RENFORCE,
  [BsdaPackagingType.ConteneurBag]: CONTENEUR_BAG,
  [BsdaPackagingType.Other]: OTHER
};

export const mapRevision = (
  review: FormRevisionRequest & BsdaRevisionRequest,
  bsdName: string
): ReviewInterface => ({
  id: review?.id,
  readableId: review?.[bsdName]?.readableId || review?.[bsdName]?.id,
  createdAt: review?.createdAt,
  status: review?.status,
  isCanceled: review?.content?.isCanceled,
  authoringCompany: review?.authoringCompany,
  comment: review?.comment,
  bsdContent: review?.[bsdName],
  approvals: review.approvals,
  details: [
    {
      dataName: DataNameEnum.ADRESS_COLLECT,
      dataOldValue: review?.[bsdName]?.emitter?.pickupSite
        ? `${review?.[bsdName]?.emitter?.pickupSite?.address}, ${review?.[bsdName]?.emitter?.pickupSite?.postalCode} ${review?.[bsdName]?.emitter?.pickupSite?.city} ${review?.[bsdName]?.emitter?.pickupSite?.infos}`
        : "",
      dataNewValue: review?.content?.emitter?.pickupSite
        ? `${review?.content?.emitter?.pickupSite?.address}, ${review?.content?.emitter?.pickupSite?.postalCode} ${review?.content?.emitter?.pickupSite?.city} ${review?.content?.emitter?.pickupSite?.infos}`
        : ""
    },
    {
      dataName: DataNameEnum.WASTE_CODE,
      dataOldValue: review?.[bsdName]?.wasteDetails?.code,
      dataNewValue: review?.content?.wasteDetails?.code
    },
    {
      dataName: DataNameEnum.WASTE_CODE,
      dataOldValue: review?.bsda?.waste?.code,
      dataNewValue: review?.content?.waste?.code
    },
    {
      dataName: DataNameEnum.POP,
      dataOldValue: review?.bsda?.waste?.pop
        ? review?.bsda?.waste?.pop
          ? BOOLEAN_TRUE_LABEL
          : BOOLEAN_FALSE_LABEL
        : "",
      dataNewValue:
        review?.content?.waste?.pop != null
          ? review?.content?.waste?.code
            ? BOOLEAN_TRUE_LABEL
            : BOOLEAN_FALSE_LABEL
          : ""
    },
    {
      dataName: DataNameEnum.WASTE_DESC,
      dataOldValue: review?.[bsdName]?.wasteDetails?.name,
      dataNewValue: review?.content?.wasteDetails?.name
    },
    {
      dataName: DataNameEnum.WASTE_DESC,
      dataOldValue: review?.[bsdName]?.wasteDetails?.packagingInfos
        ? getPackagingInfosSummary(
            review?.[bsdName]?.wasteDetails?.packagingInfos
          )
        : "",
      dataNewValue: review?.content?.wasteDetails?.packagingInfos
        ? getPackagingInfosSummary(
            review?.content?.wasteDetails?.packagingInfos
          )
        : ""
    },
    {
      dataName: DataNameEnum.WASTE_DESC,
      dataOldValue: review?.bsda?.waste?.materialName,
      dataNewValue: review?.content?.waste?.materialName
    },
    {
      dataName: DataNameEnum.SEALED_NUMBER,
      dataOldValue: review?.bsda?.waste?.sealNumbers?.join(", "),
      dataNewValue: review?.content?.waste?.sealNumbers?.join(", ")
    },
    {
      dataName: DataNameEnum.PACKAGING,
      dataOldValue: review?.[bsdName]?.packagings
        ?.map(p => `${p.quantity} ${PACKAGINGS_NAMES[p.type]}`)
        .join(", "),
      dataNewValue: review?.content?.packagings
        ?.map(p => `${p.quantity} ${PACKAGINGS_NAMES[p.type]}`)
        .join(", ")
    },
    {
      dataName: DataNameEnum.POLLUANTS_ORG,
      dataOldValue: review?.form?.wasteDetails?.pop
        ? review?.form?.wasteDetails?.pop
          ? BOOLEAN_TRUE_LABEL
          : BOOLEAN_FALSE_LABEL
        : "",
      dataNewValue:
        review?.content?.wasteDetails?.pop != null
          ? review?.content?.wasteDetails?.pop
            ? BOOLEAN_TRUE_LABEL
            : BOOLEAN_FALSE_LABEL
          : ""
    },
    {
      dataName: DataNameEnum.CAP_FINAL_DEST,
      dataOldValue: review?.[bsdName]?.temporaryStorageDetail?.destination?.cap,
      dataNewValue: review?.content?.temporaryStorageDetail?.destination?.cap
    },
    {
      dataName: DataNameEnum.CAP,
      dataOldValue: review?.[bsdName]?.destination?.cap,
      dataNewValue: review?.content?.destination?.cap
    },
    {
      dataName: review?.[bsdName]?.form?.temporaryStorageDetail
        ? DataNameEnum.CAP_TEMP_STORAGE
        : DataNameEnum.CAP,
      dataOldValue: review?.[bsdName]?.recipient?.cap,
      dataNewValue: review?.content?.recipient?.cap
    },
    {
      dataName: DataNameEnum.QTY_RECEIVED,
      dataOldValue: review?.[bsdName]?.quantityReceived,
      dataNewValue: review?.content?.quantityReceived
    },
    {
      dataName: DataNameEnum.QTY_PROCESSED,
      dataOldValue: review?.[bsdName]?.destination?.reception?.weight,
      dataNewValue: review?.content?.destination?.reception?.weight
    },
    {
      dataName: DataNameEnum.QTY_RECEIVED_TEMP_STORAGE,
      dataOldValue:
        review?.[bsdName]?.temporaryStorageDetail?.temporaryStorer
          ?.quantityReceived,
      dataNewValue:
        review?.content?.temporaryStorageDetail?.temporaryStorer
          ?.quantityReceived
    },
    {
      dataName: DataNameEnum.OPERATION_CODE,
      dataOldValue: review?.[bsdName]?.destination?.operation?.code,
      dataNewValue:
        [
          review?.content?.destination?.operation?.code,
          review?.content?.destination?.operation?.mode &&
            `(${getOperationModeLabel(
              review?.content?.destination?.operation?.mode ?? ""
            )})`
        ]
          .filter(Boolean)
          .join(" ") || null
    },
    {
      dataName: DataNameEnum.OPERATION_DONE,
      dataOldValue: review?.[bsdName]?.processingOperationDone,
      dataNewValue:
        [
          review?.content?.processingOperationDone,
          review?.content?.destinationOperationMode &&
            `(${getOperationModeLabel(
              review?.content?.destinationOperationMode ?? ""
            )})`
        ]
          .filter(Boolean)
          .join(" ") || null
    },
    {
      dataName: DataNameEnum.OPERATION_DONE_DESC,
      dataOldValue: review?.[bsdName]?.processingOperationDescription,
      dataNewValue: review?.content?.processingOperationDescription
    },
    {
      dataName: DataNameEnum.OPERATION_DONE_DESC,
      dataOldValue: review?.[bsdName]?.destination?.operation?.description,
      dataNewValue: review?.content?.destination?.operation?.description
    },
    {
      dataName: DataNameEnum.BROKER,
      dataOldValue: review?.[bsdName]?.broker,
      dataNewValue: review?.content?.broker
    },
    {
      dataName: DataNameEnum.TRADER,
      dataOldValue: review?.[bsdName]?.trader,
      dataNewValue: review?.content?.trader
    }
  ]
});
