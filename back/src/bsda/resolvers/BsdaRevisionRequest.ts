import type {
  BsdaRevisionRequest,
  BsdaRevisionRequestResolvers
} from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  expandBsdaRevisionRequestContent,
  expandBsdaFromDb
} from "../converter";
import { BsdaRevisionRequest as PrismaBsdaRevisionRequest } from "@td/prisma";

const bsdaRevisionRequestResolvers: BsdaRevisionRequestResolvers = {
  approvals: async parent => {
    const approvals = await prisma.bsdaRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .approvals();
    return approvals ?? [];
  },
  content: parent => {
    return expandBsdaRevisionRequestContent(parent as any);
  },
  authoringCompany: async (
    parent: BsdaRevisionRequest & PrismaBsdaRevisionRequest
  ) => {
    const authoringCompany = await prisma.company.findUnique({
      where: { id: parent.authoringCompanyId }
    });

    if (!authoringCompany) {
      throw new Error(
        `BsdaRevisionRequest ${parent.id} has no authoring company.`
      );
    }
    return authoringCompany;
  },
  bsda: async (parent: BsdaRevisionRequest & PrismaBsdaRevisionRequest) => {
    const actualBsda = await prisma.bsdaRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .bsda({ include: { transporters: true } });

    if (!actualBsda) {
      throw new Error(`BsdaRevisionRequest ${parent.id} has no Bsda.`);
    }

    return expandBsdaFromDb({
      ...actualBsda,
      wasteCode: parent.initialWasteCode,
      wastePop: parent.initialWastePop,
      packagings: parent.initialPackagings,
      wasteSealNumbers: parent.initialWasteSealNumbers,
      wasteMaterialName: parent.initialWasteMaterialName,
      destinationCap: parent.initialDestinationCap,
      destinationReceptionWeight: parent.initialDestinationReceptionWeight,
      destinationReceptionRefusedWeight:
        parent.initialDestinationReceptionRefusedWeight,
      destinationOperationCode: parent.initialDestinationOperationCode,
      destinationOperationDescription:
        parent.initialDestinationOperationDescription,
      destinationOperationMode: parent.initialDestinationOperationMode,
      brokerCompanyName: parent.initialBrokerCompanyName,
      brokerCompanySiret: parent.initialBrokerCompanySiret,
      brokerCompanyAddress: parent.initialBrokerCompanyAddress,
      brokerCompanyContact: parent.initialBrokerCompanyContact,
      brokerCompanyPhone: parent.initialBrokerCompanyPhone,
      brokerCompanyMail: parent.initialBrokerCompanyMail,
      brokerRecepisseNumber: parent.initialBrokerRecepisseNumber,
      brokerRecepisseDepartment: parent.initialBrokerRecepisseDepartment,
      brokerRecepisseValidityLimit: parent.initialBrokerRecepisseValidityLimit,
      emitterPickupSiteName: parent.initialEmitterPickupSiteName,
      emitterPickupSiteAddress: parent.initialEmitterPickupSiteAddress,
      emitterPickupSiteCity: parent.initialEmitterPickupSiteCity,
      emitterPickupSitePostalCode: parent.initialEmitterPickupSitePostalCode,
      emitterPickupSiteInfos: parent.initialEmitterPickupSiteInfos
    });
  }
};

export default bsdaRevisionRequestResolvers;
