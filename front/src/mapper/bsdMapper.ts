import {
  Bsff,
  Bsd,
  Form,
  Bsda,
  Bsdasri,
  Bsvhu,
  BsdType,
} from "../generated/graphql/types";
import {
  BsdDisplay,
  BsdStatusCode,
  BsdTypename,
} from "../common/types/bsdTypes";

const mapBsdStatusToBsdStatusEnum = (status: string): BsdStatusCode => {
  const bsdStatusCode = Object.keys(BsdStatusCode).find(
    key => status === key
  ) as unknown as BsdStatusCode;
  return bsdStatusCode;
};

const mapBsdTypeNameToBsdType = (typeName): BsdType | undefined => {
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
    type: mapBsdTypeNameToBsdType(bsdd.__typename),
    status: mapBsdStatusToBsdStatusEnum(bsdd.status),
    wasteDetails: {
      code: bsdd.wasteDetails?.code,
      name: bsdd.wasteDetails?.name,
      weight: bsdd.wasteDetails?.quantity,
    },
    isTempStorage: bsdd.recipient?.isTempStorage,
    updatedAt: bsdd.updatedAt,
    emittedByEcoOrganisme: bsdd.emittedByEcoOrganisme,
  };
  return bsddFormatted;
};

const createBsda = (bsda: Bsda): BsdDisplay => {
  const statusCode = bsda?.status || bsda["bsdaStatus"]; // FIXME  ?
  const bsdaFormatted: BsdDisplay = {
    id: bsda.id,
    type: mapBsdTypeNameToBsdType(bsda.__typename),
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsda.waste?.code,
      name: bsda.waste?.materialName,
      weight: bsda.weight,
    },
    updatedAt: bsda.updatedAt,
    emittedByEcoOrganisme: bsda.ecoOrganisme,
  };
  return bsdaFormatted;
};

const createBsdasri = (bsdasri: Bsdasri): BsdDisplay => {
  const statusCode = bsdasri?.status || bsdasri["bsdasriStatus"]; // FIXME  ?
  const bsdasriFormatted: BsdDisplay = {
    id: bsdasri.id,
    type: mapBsdTypeNameToBsdType(bsdasri.__typename),
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsdasri.waste?.code,
    },
    updatedAt: bsdasri.updatedAt,
    emittedByEcoOrganisme: bsdasri.ecoOrganisme?.emittedByEcoOrganisme,
  };
  return bsdasriFormatted;
};

const createBsvhu = (bsvhu: Bsvhu): BsdDisplay => {
  const statusCode = bsvhu?.status || bsvhu["bsvhuStatus"]; // FIXME ?
  const bsvhuFormatted: BsdDisplay = {
    id: bsvhu.id,
    type: mapBsdTypeNameToBsdType(bsvhu.__typename),
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsvhu?.wasteCode,
      weight: bsvhu?.weight,
    },
    updatedAt: bsvhu.updatedAt,
  };
  return bsvhuFormatted;
};

const createBsff = (bsff: Bsff): BsdDisplay => {
  const statusCode = bsff?.status || bsff["bsffStatus"]; // FIXME ?
  const bsffFormatted: BsdDisplay = {
    id: bsff.id,
    type: mapBsdTypeNameToBsdType(bsff.__typename),
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsff.waste?.code,
      name: bsff.waste?.description,
      weight: bsff?.weight,
    },
    updatedAt: bsff.updatedAt,
  };
  return bsffFormatted;
};
