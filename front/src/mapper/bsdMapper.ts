import { BsdDisplay, BsdTypename } from "../common/types/bsdTypes";
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

const createBsdd = (bsdd: Form): BsdDisplay => {
  const bsddFormatted: BsdDisplay = {
    id: bsdd.readableId,
    status: bsdd.status,
    wasteDetails: {
      code: bsdd.wasteDetails?.code,
      name: bsdd.wasteDetails?.name,
      weight: bsdd.wasteDetails?.quantity,
    },
  };
  return bsddFormatted;
};

const createBsda = (bsda: Bsda): BsdDisplay => {
  const bsdaFormatted: BsdDisplay = {
    id: bsda.id,
    status: bsda.status,
    wasteDetails: {
      code: bsda.waste?.code,
      name: bsda.waste?.materialName,
      weight: bsda.weight,
    },
  };
  return bsdaFormatted;
};

const createBsdasri = (bsda: Bsdasri): BsdDisplay => {
  const bsdasriFormatted: BsdDisplay = {
    id: bsda.id,
    status: bsda.status,
    wasteDetails: {
      code: bsda.waste?.code,
    },
  };
  return bsdasriFormatted;
};

const createBsvhu = (bsvhu: Bsvhu): BsdDisplay => {
  const bsvhuFormatted: BsdDisplay = {
    id: bsvhu.id,
    status: bsvhu.status,
    wasteDetails: {
      code: bsvhu?.wasteCode,
      weight: bsvhu?.weight,
    },
  };
  return bsvhuFormatted;
};

const createBsff = (bsff: Bsff): BsdDisplay => {
  const bsffFormatted: BsdDisplay = {
    id: bsff.id,
    status: bsff.status,
    wasteDetails: {
      code: bsff.waste?.code,
      name: bsff.waste?.description,
      weight: bsff?.weight,
    },
  };
  return bsffFormatted;
};
