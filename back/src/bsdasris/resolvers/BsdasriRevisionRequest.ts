import type {
  BsdasriRevisionRequest,
  BsdasriRevisionRequestResolvers
} from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { BsdasriRevisionRequest as PrismaBsdasriRevisionRequest } from "@td/prisma";
import {
  expandBsdasriRevisionRequestContent,
  expandBsdasriFromDB
} from "../converter";

const bsdasriRevisionRequestResolvers: BsdasriRevisionRequestResolvers = {
  approvals: async parent => {
    const approvals = await prisma.bsdasriRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .approvals();
    return approvals ?? [];
  },
  content: parent => {
    return expandBsdasriRevisionRequestContent(parent as any);
  },
  authoringCompany: async parent => {
    const authoringCompany = await prisma.bsdasriRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .authoringCompany();

    if (!authoringCompany) {
      throw new Error(
        `BsdasriRevisionRequest ${parent.id} has no authoring company.`
      );
    }
    return authoringCompany;
  },
  bsdasri: async (
    parent: BsdasriRevisionRequest & PrismaBsdasriRevisionRequest
  ) => {
    const actualBsdasri = await prisma.bsdasriRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .bsdasri();

    if (!actualBsdasri) {
      throw new Error(`BsdasriRevisionRequest ${parent.id} has no Bsdasri.`);
    }

    return expandBsdasriFromDB({
      ...actualBsdasri,
      wasteCode: parent.initialWasteCode,
      destinationWastePackagings: parent.initialDestinationWastePackagings,
      destinationReceptionWasteWeightValue:
        parent.initialDestinationReceptionWasteWeightValue,
      destinationOperationCode: parent.initialDestinationOperationCode,
      destinationOperationMode: parent.initialDestinationOperationMode,
      emitterPickupSiteName: parent.initialEmitterPickupSiteName,
      emitterPickupSiteAddress: parent.initialEmitterPickupSiteAddress,
      emitterPickupSiteCity: parent.initialEmitterPickupSiteCity,
      emitterPickupSitePostalCode: parent.initialEmitterPickupSitePostalCode,
      emitterPickupSiteInfos: parent.initialEmitterPickupSiteInfos
    });
  }
};

export default bsdasriRevisionRequestResolvers;
