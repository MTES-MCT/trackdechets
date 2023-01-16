import {
  Bsff,
  Bsd,
  Form,
  Bsda,
  Bsdasri,
  Bsvhu,
  BsdType,
} from "../../generated/graphql/types";
import {
  BsdDisplay,
  BsdStatusCode,
  BsdTypename,
} from "../../common/types/bsdTypes";

const mapBsdStatusToBsdStatusEnum = (status: string): BsdStatusCode => {
  const bsdStatusCode = Object.keys(BsdStatusCode).find(
    key => status === key
  ) as unknown as BsdStatusCode;
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

export const formatBsd = (bsd: Bsd): BsdDisplay | null => {
  switch (bsd.__typename) {
    case BsdTypename.Bsdd:
      return createBsdd(bsd);
    case BsdTypename.Bsda:
      return createBsda(bsd);
    case BsdTypename.Bsdasri:
      return createBsdasri(bsd);
    case BsdTypename.Bsvhu:
      return createBsvhu(bsd);
    case BsdTypename.Bsff:
      return createBsff(bsd);

    default:
      return null;
  }
};

const createBsdd = (bsdd: Form): BsdDisplay => {
  const bsddFormatted: BsdDisplay = {
    id: bsdd.readableId,
    type: mapBsdTypeNameToBsdType(bsdd.__typename) || BsdType.Bsdd,
    isDraft: bsdd.status === BsdStatusCode.DRAFT.toString(),
    status: mapBsdStatusToBsdStatusEnum(bsdd.status),
    wasteDetails: {
      code: bsdd.wasteDetails?.code,
      name: bsdd.wasteDetails?.name,
      weight: bsdd.wasteDetails?.quantity,
    },
    isTempStorage: bsdd.recipient?.isTempStorage,
    emitter: bsdd.emitter,
    destination: bsdd.recipient,
    transporter: bsdd.transporter,
    ecoOrganisme: bsdd.ecoOrganisme,
    updatedAt: bsdd.updatedAt,
    emittedByEcoOrganisme: bsdd.emittedByEcoOrganisme,
    grouping: bsdd.grouping,
    temporaryStorageDetail: bsdd.temporaryStorageDetail,
  };
  return bsddFormatted;
};

const createBsda = (bsda: Bsda): BsdDisplay => {
  const statusCode = bsda?.status || bsda["bsdaStatus"]; // FIXME  ?
  const bsdaFormatted: BsdDisplay = {
    id: bsda.id,
    type: mapBsdTypeNameToBsdType(bsda.__typename) || BsdType.Bsda,
    isDraft: bsda.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsda.waste?.code || bsda.waste?.["bsdaCode"],
      name: bsda.waste?.materialName,
      weight: bsda.weight,
    },
    emitter: bsda.emitter || bsda["bsdaEmitter"],
    destination: bsda.destination || bsda["bsdaDestination"],
    transporter: bsda.transporter || bsda["bsdaTransporter"],
    ecoOrganisme: bsda.ecoOrganisme,
    updatedAt: bsda.updatedAt,
    emittedByEcoOrganisme: bsda.ecoOrganisme,
    worker: bsda.worker,
    bsdWorkflowType: bsda.type || bsda["bsdaType"],
    grouping: bsda.grouping,
  };
  return bsdaFormatted;
};

const createBsdasri = (bsdasri: Bsdasri): BsdDisplay => {
  const statusCode = bsdasri?.status || bsdasri["bsdasriStatus"]; // FIXME  ?
  const bsdasriFormatted: BsdDisplay = {
    id: bsdasri.id,
    type: mapBsdTypeNameToBsdType(bsdasri.__typename) || BsdType.Bsdasri,
    isDraft: bsdasri.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsdasri.waste?.code || bsdasri["bsdasriWaste"]?.code,
    },
    emitter: bsdasri.emitter || bsdasri["bsdasriEmitter"],
    destination: bsdasri.destination || bsdasri["bsdasriDestination"],
    transporter: bsdasri.transporter || bsdasri["bsdasriTransporter"],
    ecoOrganisme: bsdasri.ecoOrganisme,
    updatedAt: bsdasri.updatedAt,
    emittedByEcoOrganisme: bsdasri.ecoOrganisme?.emittedByEcoOrganisme,
    bsdWorkflowType: bsdasri.type,
    grouping: bsdasri.grouping,
    synthesizing: bsdasri.synthesizing,
  };
  return bsdasriFormatted;
};

const createBsvhu = (bsvhu: Bsvhu): BsdDisplay => {
  const statusCode = bsvhu?.status || bsvhu["bsvhuStatus"]; // FIXME ?
  const bsvhuFormatted: BsdDisplay = {
    id: bsvhu.id,
    type: mapBsdTypeNameToBsdType(bsvhu.__typename) || BsdType.Bsvhu,
    isDraft: bsvhu.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsvhu?.wasteCode,
      weight: bsvhu?.weight,
    },
    emitter: bsvhu.emitter || bsvhu["bsvhuEmitter"],
    destination: bsvhu.destination || bsvhu["bsvhuDestination"],
    transporter: bsvhu.transporter || bsvhu["bsvhuTransporter"],
    updatedAt: bsvhu.updatedAt,
  };
  return bsvhuFormatted;
};

const createBsff = (bsff: Bsff): BsdDisplay => {
  const statusCode = bsff?.status || bsff["bsffStatus"]; // FIXME ?
  const bsffFormatted: BsdDisplay = {
    id: bsff.id,
    type: mapBsdTypeNameToBsdType(bsff.__typename) || BsdType.Bsff,
    isDraft: bsff.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsff.waste?.code,
      name: bsff.waste?.description,
      weight: bsff?.weight,
    },
    emitter: bsff.emitter || bsff["bsffEmitter"],
    destination: bsff.destination || bsff["bsffDestination"],
    transporter: bsff.transporter || bsff["bsffTransporter"],
    updatedAt: bsff.updatedAt,
    bsdWorkflowType: bsff.type,
    grouping: bsff.grouping,
  };
  return bsffFormatted;
};
