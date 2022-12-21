import {
  BsdDisplay,
  BsdStatusCode,
  BsdTypename,
} from "../common/types/bsdTypes";
import { Bsff, Bsd, Form, Bsda, Bsdasri, Bsvhu } from "generated/graphql/types";

export const createBsd = (bsd: Bsd): BsdDisplay | null => {
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

const mapStatusToBsdStatusEnum = (status: string): BsdStatusCode => {
  switch (status) {
    case BsdStatusCode.DRAFT:
      return BsdStatusCode.DRAFT;
    case BsdStatusCode.SEALED:
      return BsdStatusCode.SEALED;
    case BsdStatusCode.SENT:
      return BsdStatusCode.SENT;
    case BsdStatusCode.RECEIVED:
      return BsdStatusCode.RECEIVED;
    case BsdStatusCode.ACCEPTED:
      return BsdStatusCode.ACCEPTED;
    case BsdStatusCode.PROCESSED:
      return BsdStatusCode.PROCESSED;
    case BsdStatusCode.AWAITING_GROUP:
      return BsdStatusCode.AWAITING_GROUP;
    case BsdStatusCode.GROUPED:
      return BsdStatusCode.GROUPED;
    case BsdStatusCode.NO_TRACEABILITY:
      return BsdStatusCode.NO_TRACEABILITY;
    case BsdStatusCode.REFUSED:
      return BsdStatusCode.REFUSED;
    case BsdStatusCode.TEMP_STORED:
      return BsdStatusCode.TEMP_STORED;
    case BsdStatusCode.TEMP_STORER_ACCEPTED:
      return BsdStatusCode.TEMP_STORER_ACCEPTED;
    case BsdStatusCode.RESEALED:
      return BsdStatusCode.RESEALED;
    case BsdStatusCode.RESENT:
      return BsdStatusCode.RESENT;
    case BsdStatusCode.SIGNED_BY_PRODUCER:
      return BsdStatusCode.SIGNED_BY_PRODUCER;
    case BsdStatusCode.INITIAL:
      return BsdStatusCode.INITIAL;
    case BsdStatusCode.SIGNED_BY_EMITTER:
      return BsdStatusCode.SIGNED_BY_EMITTER;
    case BsdStatusCode.INTERMEDIATELY_PROCESSED:
      return BsdStatusCode.INTERMEDIATELY_PROCESSED;
    case BsdStatusCode.SIGNED_BY_TEMP_STORER:
      return BsdStatusCode.SIGNED_BY_TEMP_STORER;
    case BsdStatusCode.PARTIALLY_REFUSED:
      return BsdStatusCode.PARTIALLY_REFUSED;
    case BsdStatusCode.FOLLOWED_WITH_PNTTD:
      return BsdStatusCode.FOLLOWED_WITH_PNTTD;
    case BsdStatusCode.SIGNED_BY_WORKER:
      return BsdStatusCode.SIGNED_BY_WORKER;
    case BsdStatusCode.AWAITING_CHILD:
      return BsdStatusCode.AWAITING_CHILD;

    default:
      return BsdStatusCode.DRAFT;
  }
};

const createBsdd = (bsdd: Form): BsdDisplay => {
  const bsddFormatted: BsdDisplay = {
    id: bsdd.readableId,
    status: mapStatusToBsdStatusEnum(bsdd.status),
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
  const bsdaFormatted: BsdDisplay = {
    id: bsda.id,
    status: mapStatusToBsdStatusEnum(bsda.status),
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
  const bsdasriFormatted: BsdDisplay = {
    id: bsdasri.id,
    status: mapStatusToBsdStatusEnum(bsdasri.status),
    wasteDetails: {
      code: bsdasri.waste?.code,
    },
    updatedAt: bsdasri.updatedAt,
    emittedByEcoOrganisme: bsdasri.ecoOrganisme?.emittedByEcoOrganisme,
  };
  return bsdasriFormatted;
};

const createBsvhu = (bsvhu: Bsvhu): BsdDisplay => {
  const bsvhuFormatted: BsdDisplay = {
    id: bsvhu.id,
    status: mapStatusToBsdStatusEnum(bsvhu.status),
    wasteDetails: {
      code: bsvhu?.wasteCode,
      weight: bsvhu?.weight,
    },
    updatedAt: bsvhu.updatedAt,
  };
  return bsvhuFormatted;
};

const createBsff = (bsff: Bsff): BsdDisplay => {
  const bsffFormatted: BsdDisplay = {
    id: bsff.id,
    status: mapStatusToBsdStatusEnum(bsff.status),
    wasteDetails: {
      code: bsff.waste?.code,
      name: bsff.waste?.description,
      weight: bsff?.weight,
    },
    updatedAt: bsff.updatedAt,
  };
  return bsffFormatted;
};
