import {
  Broker,
  Bsda,
  BsdasriPackagingType,
  BsdaRevisionRequest,
  BsdasriRevisionRequest,
  BsdaRevisionRequestApproval,
  BsdasriRevisionRequestApproval,
  Form,
  FormCompany,
  FormRevisionRequest,
  FormRevisionRequestApproval,
  Maybe,
  RevisionRequestStatus,
  Trader
} from "@td/codegen-ui";
import { getOperationModeLabel } from "../../../common/operationModes";
import { getPackagingInfosSummary } from "../../../common/utils/packagingsBsddSummary";
import {
  BOOLEAN_FALSE_LABEL,
  BOOLEAN_TRUE_LABEL,
  OTHER,
  BOITE_CARTON,
  BOITE_PERFORANTS,
  GRAND_EMBALLAGE,
  GRV,
  FUT
} from "./wordingsRevision";

export enum DataNameEnum {
  ADRESS_COLLECT = "Adresse de collecte",
  WASTE_CODE = "Code déchet",
  NAME_COLLECT = "Nom de chantier",
  POP = "Pop",
  WASTE_DESC = "Description déchet",
  SEALED_NUMBER = "Numéros de scellés",
  PACKAGING = "Conditionnement",
  POLLUANTS_ORG = "Présence de polluants organiques persistants",
  CAP_FINAL_DEST = "CAP (destination finale)",
  CAP = "CAP",
  CAP_EXUTOIRE = "CAP de l'exutoire",
  SAMPLE_NUMBER = "Numéro d'échantillon",
  CAP_TEMP_STORAGE = "CAP (entreposage provisoire ou reconditionnement)",
  QTY_ESTIMATED = "Poids estimé (en tonnes)",
  QTY_RECEIVED = "Quantité reçue (tonnes)",
  QTY_REFUSED = "Quantité refusée (tonnes)",
  QTY_PROCESSED = "Quantité traitée (en tonnes)",
  QTY_PROCESSED_KG = "Quantité traitée (en kg)",
  QTY_RECEIVED_TEMP_STORAGE = "Quantité reçue sur l'installation d'entreposage provisoire ou reconditionnement (tonnes)",
  QTY_REFUSED_TEMP_STORAGE = "Quantité refusée par l'installation d'entreposage provisoire ou reconditionnement (tonnes)",
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
    | Array<BsdasriRevisionRequestApproval>
    | Array<FormRevisionRequestApproval>;
  comment: string;
  bsdContent: Form | Bsda;
  details: ReviewDetailInterface[];
}

const BSDASRI_PACKAGINGS_NAMES = {
  [BsdasriPackagingType.BoiteCarton]: BOITE_CARTON,
  [BsdasriPackagingType.Fut]: FUT,
  [BsdasriPackagingType.BoitePerforants]: BOITE_PERFORANTS,
  [BsdasriPackagingType.GrandEmballage]: GRAND_EMBALLAGE,
  [BsdasriPackagingType.Grv]: GRV,
  [BsdasriPackagingType.Autre]: OTHER
};

const formatBsdasriPackagingName = packaging => {
  const formattedName =
    packaging.type === BsdasriPackagingType.Autre
      ? `${packaging.quantity} ${BSDASRI_PACKAGINGS_NAMES[packaging.type]} ${
          packaging.other ? `(${packaging.other})` : ""
        }`
      : `${packaging.quantity} ${BSDASRI_PACKAGINGS_NAMES[packaging.type]}`;

  return `${formattedName} - ${packaging.volume} l`;
};

export const mapRevision = (
  review: FormRevisionRequest & BsdaRevisionRequest & BsdasriRevisionRequest,
  bsdName: string
): ReviewInterface => {
  return {
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
        dataOldValue:
          review?.[bsdName]?.emitter?.pickupSite?.address ||
          review?.[bsdName]?.emitter?.pickupSite?.postalCode ||
          review?.[bsdName]?.emitter?.pickupSite?.city ||
          review?.[bsdName]?.emitter?.pickupSite?.infos
            ? `${review?.[bsdName]?.emitter?.pickupSite?.address}, ${
                review?.[bsdName]?.emitter?.pickupSite?.postalCode
              } ${review?.[bsdName]?.emitter?.pickupSite?.city} ${
                review?.[bsdName]?.emitter?.pickupSite?.infos ?? ""
              }`
            : "Non renseigné",
        dataNewValue:
          review?.content?.emitter?.pickupSite?.address ||
          review?.content?.emitter?.pickupSite?.postalCode ||
          review?.content?.emitter?.pickupSite?.city ||
          review?.content?.emitter?.pickupSite?.infos
            ? `${review?.content?.emitter?.pickupSite?.address}, ${
                review?.content?.emitter?.pickupSite?.postalCode
              } ${review?.content?.emitter?.pickupSite?.city} ${
                review?.content?.emitter?.pickupSite?.infos ?? ""
              }`
            : ""
      },
      {
        dataName: DataNameEnum.NAME_COLLECT,
        dataOldValue: review?.[bsdName]?.emitter?.pickupSite.name
          ? `${review?.[bsdName]?.emitter?.pickupSite?.name}`
          : "Non renseigné",
        dataNewValue: review?.content?.emitter?.pickupSite?.name
          ? `${review?.content?.emitter?.pickupSite?.name}`
          : ""
      },
      {
        dataName: DataNameEnum.WASTE_CODE,
        dataOldValue: review?.[bsdName]?.wasteDetails?.code,
        dataNewValue: review?.content?.wasteDetails?.code
      },

      {
        dataName: DataNameEnum.WASTE_CODE,
        dataOldValue: review?.[bsdName]?.waste?.code,
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
          ? getPackagingInfosSummary(review[bsdName].packagings)
          : "",
        dataNewValue: review?.content?.packagings
          ? getPackagingInfosSummary(review.content.packagings)
          : ""
      },
      {
        dataName: DataNameEnum.PACKAGING,
        dataOldValue: review?.[bsdName]?.destination?.reception?.packagings
          ?.map(p => formatBsdasriPackagingName(p))
          .join(", "),
        dataNewValue: review?.content?.destination?.reception?.packagings
          ?.map(p => formatBsdasriPackagingName(p))
          .join(", ")
      },
      {
        dataName: DataNameEnum.QTY_ESTIMATED,
        dataOldValue: review?.[bsdName]?.wasteDetails?.quantity,
        dataNewValue: review?.content?.wasteDetails?.quantity
      },
      {
        dataName: DataNameEnum.SAMPLE_NUMBER,
        dataOldValue: review?.[bsdName]?.wasteDetails?.sampleNumber,
        dataNewValue: review?.content?.wasteDetails?.sampleNumber
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
        dataOldValue:
          review?.[bsdName]?.temporaryStorageDetail?.destination?.cap,
        dataNewValue: review?.content?.temporaryStorageDetail?.destination?.cap
      },
      {
        dataName: DataNameEnum.CAP_EXUTOIRE,
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
        dataOldValue:
          review?.[bsdName]?.quantityReceived ||
          review?.[bsdName]?.destination?.reception?.weight,
        dataNewValue:
          review?.content?.quantityReceived ||
          review?.content?.destination?.reception?.weight
      },
      {
        dataName: DataNameEnum.QTY_REFUSED,
        dataOldValue:
          review?.[bsdName]?.quantityRefused ||
          review?.[bsdName]?.destination?.reception?.refusedWeight,
        dataNewValue:
          review?.content?.quantityRefused ||
          review?.content?.destination?.reception?.refusedWeight
      },
      {
        dataName: DataNameEnum.QTY_PROCESSED_KG,
        dataOldValue: review?.[bsdName]?.destination?.operation?.weight?.value,
        dataNewValue: review?.content?.destination?.operation?.weight
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
        dataName: DataNameEnum.QTY_REFUSED_TEMP_STORAGE,
        dataOldValue:
          review?.[bsdName]?.temporaryStorageDetail?.temporaryStorer
            ?.quantityRefused,
        dataNewValue:
          review?.content?.temporaryStorageDetail?.temporaryStorer
            ?.quantityRefused
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
  };
};
