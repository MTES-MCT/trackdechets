import type {
  FormRevisionRequest,
  FormRevisionRequestResolvers
} from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  expandBsddRevisionRequestContent,
  expandFormFromDb,
  expandableFormIncludes
} from "../converter";
import { BsddRevisionRequest } from "@td/prisma";
import { removeEmptyKeys } from "../../common/converter";

const formRevisionRequestResolvers: FormRevisionRequestResolvers = {
  approvals: async parent => {
    const approvals = await prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .approvals();

    return approvals ?? [];
  },
  content: parent => {
    return expandBsddRevisionRequestContent(parent as any);
  },
  authoringCompany: async parent => {
    const authoringCompany = await prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .authoringCompany();

    if (!authoringCompany) {
      throw new Error(
        `FormRevisionRequest ${parent.id} has no authoring company.`
      );
    }
    return authoringCompany;
  },
  form: async (parent: FormRevisionRequest & BsddRevisionRequest) => {
    const fullBsdd = await prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .bsdd({ include: expandableFormIncludes });

    if (!fullBsdd) {
      throw new Error(`FormRevisionRequest ${parent.id} has no form.`);
    }

    const historicForm = removeEmptyKeys({
      recipientCap: parent.initialRecipientCap,
      wasteDetailsCode: parent.initialWasteDetailsCode,
      wasteDetailsName: parent.initialWasteDetailsName,
      wasteDetailsPop: parent.initialWasteDetailsPop,
      wasteDetailsPackagingInfos: parent.initialWasteDetailsPackagingInfos,
      wasteAcceptationStatus: parent.initialWasteAcceptationStatus,
      wasteRefusalReason: parent.initialWasteRefusalReason,
      wasteDetailsSampleNumber: parent.initialWasteDetailsSampleNumber,
      wasteDetailsQuantity: parent.initialWasteDetailsQuantity,
      quantityReceived: parent.initialQuantityReceived,
      quantityRefused: parent.initialQuantityRefused,
      processingOperationDone: parent.initialProcessingOperationDone,
      destinationOperationMode: parent.initialDestinationOperationMode,
      processingOperationDescription:
        parent.initialProcessingOperationDescription,
      brokerCompanyName: parent.initialBrokerCompanyName,
      brokerCompanySiret: parent.initialBrokerCompanySiret,
      brokerCompanyAddress: parent.initialBrokerCompanyAddress,
      brokerCompanyContact: parent.initialBrokerCompanyContact,
      brokerCompanyPhone: parent.initialBrokerCompanyPhone,
      brokerCompanyMail: parent.initialBrokerCompanyMail,
      brokerReceipt: parent.initialBrokerReceipt,
      brokerDepartment: parent.initialBrokerDepartment,
      brokerValidityLimit: parent.initialBrokerValidityLimit,
      traderCompanyName: parent.initialTraderCompanyName,
      traderCompanySiret: parent.initialTraderCompanySiret,
      traderCompanyAddress: parent.initialTraderCompanyAddress,
      traderCompanyContact: parent.initialTraderCompanyContact,
      traderCompanyPhone: parent.initialTraderCompanyPhone,
      traderCompanyMail: parent.initialTraderCompanyMail,
      traderReceipt: parent.initialTraderReceipt,
      traderDepartment: parent.initialTraderDepartment,
      traderValidityLimit: parent.initialTraderValidityLimit
    });

    return expandFormFromDb({
      ...fullBsdd,
      forwardedIn: fullBsdd.forwardedIn
        ? {
            ...fullBsdd.forwardedIn,
            recipientCap: parent.initialTemporaryStorageDestinationCap,
            processingOperationDone:
              parent.initialTemporaryStorageDestinationProcessingOperation,
            quantityReceived:
              parent.initialTemporaryStorageTemporaryStorerQuantityReceived,
            quantityRefused:
              parent.initialTemporaryStorageTemporaryStorerQuantityRefused
          }
        : null,
      ...historicForm
    });
  }
};

export default formRevisionRequestResolvers;
