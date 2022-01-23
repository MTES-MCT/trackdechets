import { nullIfNoValues } from "../forms/form-converter";

import {
  CommonBsd,
  CommonBsdd,
  CommonBsdasri,
  CommonBsda,
  CommonBsdCompany,
  CommonBsdActor
} from "../generated/graphql/types";
import { BsdConverterContext, BsdasriConverterContext } from "./types";
import { BsdElastic } from "../common/elastic";

type elasticToBsdd = (node: BsdElastic) => CommonBsdd;
const elasticToBsdd = node => {
  if (node._source.type !== "BSDD") {
    return {};
  }

  const lastSegmentInfo = !!node._source.bsdd?.lastSegment
    ? {
        lastSegment: {
          id: node._source.bsdd.lastSegment.id,
          takenOver: node._source.bsdd?.lastSegment?.takenOver,
          readyToTakeOver: !!node._source.bsdd?.lastSegment?.readyToTakeOver,
          previousTransporterCompanySiret:
            node._source.bsdd?.lastSegment?.previousTransporterCompanySiret
        }
      }
    : {};

  const temporaryStorageInfo = {
    temporaryStorage: {
      recipientIsTempStorage:
        !!node._source.bsdd?.temporaryStorage?.recipientIsTempStorage,
      transporterCompanySiret:
        node._source.bsdd?.temporaryStorage?.transporterCompanySiret,
      destinationCompanySiret:
        node._source.bsdd?.temporaryStorage?.destinationCompanySiret
    }
  };

  const stateSummaryInfo = {
    stateSummary: {
      transporterCustomInfo:
        node._source.bsdd?.stateSummary?.transporterCustomInfo,
      transporterNumberPlate:
        node._source.bsdd?.stateSummary?.transporterNumberPlate,
      recipientName: node._source.bsdd?.stateSummary?.recipient?.name
    }
  };
  return {
    bsdd: {
      currentTransporterSiret: node._source.bsdd?.currentTransporterSiret,
      nextTransporterSiret: node._source.bsdd?.nextTransporterSiret,
      ...lastSegmentInfo,
      ...temporaryStorageInfo,
      ...stateSummaryInfo
    }
  };
};

type elasticToBsdasri = (
  node: BsdElastic,
  bsdasriSiretsAllowingDirectTakeover: string[]
) => CommonBsdasri;
const elasticToBsdasri = (node, context: BsdasriConverterContext) => {
  if (node._source.type !== "BSDASRI") {
    return {};
  }
  return {
    bsdasri: {
      type: node._source.bsdasri?.type,
      groupingCount: node._source.bsdasri?.groupingCount,
      emitterAllowDirectTakeOver:
        context.siretsAllowingDirectDasriTakeover.includes(
          node._source.emitterCompanySiret
        )
    }
  };
};

type elasticToBsda = (node: BsdElastic) => CommonBsda;
const elasticToBsda = node => {
  if (node._source.type !== "BSDA") {
    return {};
  }

  return {
    bsda: {
      type: node._source.bsda?.type,
      worker: nullIfNoValues<CommonBsdActor>({
        company: nullIfNoValues<CommonBsdCompany>({
          name: node._source.bsda?.workerCompanyName ?? null,
          siret: node._source.bsda?.workerCompanySiret ?? null
        })
      }),

      emitterIsPrivateIndividual: node._source.bsda.emitterIsPrivateIndividual,
      wasteMaterialName: node._source.bsda.wasteMaterialName
    }
  };
};

type ElasticToBsdFn = (
  node,
  converterContext: BsdConverterContext
) => CommonBsd;
export const elasticToBsd: ElasticToBsdFn = (node, converterContext) => {
  return {
    id: node._source.id,
    readableId: node._source.readableId,
    type: node._source.type,
    isDraft: node._source?.isDraft ?? false,
    emitter: {
      company: {
        name: node._source.emitterCompanyName,
        siret: node._source.emitterCompanySiret
      }
    },
    destination: {
      company: {
        name: node._source.destinationCompanyName,
        siret: node._source.destinationCompanySiret
      }
    },
    transporter: {
      company: {
        name: node._source.transporterCompanyName,
        siret: node._source.transporterCompanySiret
      },
      numberPlate: node._source.transporterNumberPlate ?? [],
      customInfo: node._source.transporterCustomInfo
    },
    waste: {
      code: node._source.wasteCode,
      description: node._source.wasteDescription
    },
    status: node._source.status,

    ...elasticToBsdd(node),
    ...elasticToBsda(node),
    ...elasticToBsdasri(node, converterContext?.bsdasri)
  };
};
