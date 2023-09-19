import { Bsff, Bsdasri, Bsvhu, BsdType } from "../../generated/graphql/types";
import {
  BsdDisplay,
  BsdStatusCode,
  BsdTypename,
  BsdWithReview,
  BsdaWithReview,
  FormWithReview,
  TBsdStatusCode,
} from "../common/types/bsdTypes";

const mapBsdStatusToBsdStatusEnum = (status: string): TBsdStatusCode => {
  const bsdStatusCode = Object.values(BsdStatusCode).find(
    key => status === key.toUpperCase()
  ) as unknown as TBsdStatusCode;
  return bsdStatusCode;
};

const mapBsdTypeNameToBsdType = (
  typeName: string | undefined
): BsdType | undefined => {
  switch (typeName) {
    case BsdTypename.Bsdd:
      return BsdType.Bsdd;
    case BsdTypename.Bsda:
      return BsdType.Bsda;
    case BsdTypename.Bsdasri:
      return BsdType.Bsdasri;
    case BsdTypename.Bsvhu:
      return BsdType.Bsvhu;
    case BsdTypename.Bsff:
      return BsdType.Bsff;

    default:
      return undefined;
  }
};

export const formatBsd = (bsd: BsdWithReview): BsdDisplay | null => {
  switch (bsd.__typename) {
    case BsdTypename.Bsdd:
      return mapBsdd(bsd);
    case BsdTypename.Bsda:
      return mapBsda(bsd);
    case BsdTypename.Bsdasri:
      return mapBsdasri(bsd);
    case BsdTypename.Bsvhu:
      return mapBsvhu(bsd);
    case BsdTypename.Bsff:
      return mapBsff(bsd);

    default:
      return null;
  }
};

export const mapBsdd = (bsdd: FormWithReview): BsdDisplay => {
  const bsddFormatted: BsdDisplay = {
    id: bsdd.id,
    readableid: bsdd.readableId,
    type: mapBsdTypeNameToBsdType(bsdd.__typename) || BsdType.Bsdd,
    isDraft: bsdd.status === BsdStatusCode.Draft,
    emitterType: bsdd.emitter?.type,
    status: mapBsdStatusToBsdStatusEnum(bsdd.status),
    wasteDetails: {
      code: bsdd.wasteDetails?.code,
      name: bsdd.wasteDetails?.name,
      weight:
        bsdd.review?.["content"]?.quantityReceived ||
        bsdd.quantityReceived ||
        bsdd.temporaryStorageDetail?.wasteDetails?.quantity ||
        bsdd.wasteDetails?.quantity,
    },
    isTempStorage: bsdd.recipient?.isTempStorage,
    emitter: bsdd.emitter,
    destination: bsdd.recipient,
    transporter: bsdd.transporter,
    ecoOrganisme: bsdd.ecoOrganisme,
    updatedAt: bsdd.stateSummary?.lastActionOn,
    emittedByEcoOrganisme: bsdd.emittedByEcoOrganisme,
    grouping: bsdd.grouping,
    temporaryStorageDetail: bsdd.temporaryStorageDetail,
    bsdWorkflowType: bsdd.emitter?.type,
    review: bsdd?.review,
    transporterCustomInfo: bsdd.stateSummary?.transporterCustomInfo,
    transporterNumberPlate: bsdd.stateSummary?.transporterNumberPlate,
  } as BsdDisplay;
  return bsddFormatted;
};

const mapBsda = (bsda: BsdaWithReview): BsdDisplay => {
  const statusCode = bsda?.status || bsda["bsdaStatus"];
  const bsdaFormatted: BsdDisplay = {
    id: bsda.id,
    readableid: bsda.id,
    type: mapBsdTypeNameToBsdType(bsda.__typename) || BsdType.Bsda,
    isDraft: bsda.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsda.waste?.code || bsda.waste?.["bsdaCode"],
      name: bsda.waste?.materialName,
      weight:
        bsda.review?.["content"]?.destination?.reception?.weight ||
        bsda?.destination?.reception?.weight ||
        bsda?.weight?.value,
    },
    emitter: bsda.emitter || bsda["bsdaEmitter"],
    destination: bsda.destination || bsda["bsdaDestination"],
    transporter: bsda.transporter || bsda["bsdaTransporter"],
    ecoOrganisme: bsda.ecoOrganisme,
    updatedAt: bsda.updatedAt || bsda["bsdaUpdatedAt"],
    emittedByEcoOrganisme: bsda.ecoOrganisme,
    worker: bsda.worker,
    bsdWorkflowType: bsda.type || bsda["bsdaType"],
    grouping: bsda.grouping,
    review: bsda?.review,
    transporterCustomInfo:
      bsda.transporter?.customInfo || bsda["bsdaTransporter"]?.customInfo,
    transporterNumberPlate:
      bsda.transporter?.transport?.plates ||
      bsda["bsdaTransporter"]?.transport?.plates,
  };
  return bsdaFormatted;
};
const truncateTransporterInfo = (text?: string) =>
  !!text ? text.slice(0, 15) : text;

export const mapBsdasri = (bsdasri: Bsdasri): BsdDisplay => {
  const statusCode = bsdasri?.status || bsdasri["bsdasriStatus"];
  const bsdasriFormatted: BsdDisplay = {
    id: bsdasri.id,
    readableid: bsdasri.id,
    type: mapBsdTypeNameToBsdType(bsdasri.__typename) || BsdType.Bsdasri,
    isDraft: bsdasri.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsdasri.waste?.code || bsdasri["bsdasriWaste"]?.code,
      weight: bsdasri.destination?.operation?.weight?.value,
    },
    emitter: bsdasri.emitter || bsdasri["bsdasriEmitter"],
    destination: bsdasri.destination || bsdasri["bsdasriDestination"],
    transporter: bsdasri.transporter || bsdasri["bsdasriTransporter"],
    ecoOrganisme: bsdasri.ecoOrganisme,
    updatedAt: bsdasri.updatedAt,
    emittedByEcoOrganisme: bsdasri.ecoOrganisme?.emittedByEcoOrganisme,
    bsdWorkflowType: bsdasri?.type,
    grouping: bsdasri?.grouping,
    synthesizing: bsdasri?.synthesizing,
    allowDirectTakeOver: bsdasri?.allowDirectTakeOver,
    transporterCustomInfo: truncateTransporterInfo(
      bsdasri.transporter?.customInfo ||
        bsdasri["bsdasriTransporter"]?.customInfo
    ),
    transporterNumberPlate:
      bsdasri.transporter?.transport?.plates ||
      bsdasri["bsdasriTransporter"]?.transport?.plates,
  };
  return bsdasriFormatted;
};

const mapBsvhu = (bsvhu: Bsvhu): BsdDisplay => {
  const statusCode = bsvhu?.status || bsvhu["bsvhuStatus"];
  const bsvhuFormatted: BsdDisplay = {
    id: bsvhu.id,
    readableid: bsvhu.id,
    type: mapBsdTypeNameToBsdType(bsvhu.__typename) || BsdType.Bsvhu,
    isDraft: bsvhu.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsvhu?.wasteCode,
      weight: bsvhu?.destination?.reception?.weight || bsvhu?.weight?.value,
    },
    emitter: bsvhu.emitter || bsvhu["bsvhuEmitter"],
    destination: bsvhu.destination || bsvhu["bsvhuDestination"],
    transporter: bsvhu.transporter || bsvhu["bsvhuTransporter"],
    updatedAt: bsvhu["bsvhuUpdatedAt"],
  };
  return bsvhuFormatted;
};

const mapBsff = (bsff: Bsff): BsdDisplay => {
  const statusCode = bsff?.status || bsff["bsffStatus"];
  const bsffFormatted: BsdDisplay = {
    id: bsff.id,
    readableid: bsff.id,
    type: mapBsdTypeNameToBsdType(bsff.__typename) || BsdType.Bsff,
    isDraft: bsff.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsff.waste?.code,
      name: bsff.waste?.description,
      weight: bsff["bsffWeight"]?.value,
    },
    emitter: bsff.emitter || bsff["bsffEmitter"],
    destination: bsff.destination || bsff["bsffDestination"],
    transporter: bsff.transporter || bsff["bsffTransporter"],
    updatedAt: bsff["bsffUpdatedAt"],
    bsdWorkflowType: bsff.type,
    grouping: bsff.grouping,
    transporterCustomInfo: bsff["bsffTransporter"]?.customInfo,
    transporterNumberPlate: bsff["bsffTransporter"]?.transport?.plates,
  };
  return bsffFormatted;
};
