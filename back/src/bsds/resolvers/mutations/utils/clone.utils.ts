import { Prisma } from "@prisma/client";
import { prisma } from "../../../../../../libs/back/prisma/src";
import getReadableId from "../../../../forms/readableId";
import { getFormRepository } from "../../../../forms/repository";
import { runInTransaction } from "../../../../common/repository/helper";
import { prismaJsonNoNull } from "../../../../common/converter";

export const cloneBsda = id => {};

export const cloneBsdasri = id => {};

export const cloneBsff = id => {};

export const cloneBsvhu = id => {};

export const cloneBspaoh = id => {};

export const cloneBsdd = async (user: Express.User, id: string) => {
  const bsdd = await prisma.form.findFirstOrThrow({
    where: { id },
    include: {
      transporters: true,
      intermediaries: true,
      finalOperations: true
    }
  });

  await runInTransaction(async transaction => {
    const { create } = getFormRepository(user, transaction);

    const newBsddCreateInput: Prisma.FormCreateInput = {
      owner: {
        connect: {
          id: bsdd.ownerId
        }
      },
      readableId: getReadableId(),
      brokerCompanyAddress: bsdd.brokerCompanyAddress,
      brokerCompanyContact: bsdd.brokerCompanyContact,
      brokerCompanyMail: bsdd.brokerCompanyMail,
      brokerCompanyName: bsdd.brokerCompanyName,
      brokerCompanyPhone: bsdd.brokerCompanyPhone,
      brokerCompanySiret: bsdd.brokerCompanySiret,
      brokerDepartment: bsdd.brokerDepartment,
      brokerReceipt: bsdd.brokerReceipt,
      brokerValidityLimit: bsdd.brokerValidityLimit,
      bsddRevisionRequests: undefined,
      canAccessDraftSirets: bsdd.canAccessDraftSirets,
      citerneNotWashedOutReason: bsdd.citerneNotWashedOutReason,
      createdAt: bsdd.createdAt,
      currentTransporterOrgId: bsdd.currentTransporterOrgId,
      customId: bsdd.customId,
      destinationOperationMode: bsdd.destinationOperationMode,
      ecoOrganismeName: bsdd.ecoOrganismeName,
      ecoOrganismeSiret: bsdd.ecoOrganismeSiret,
      emittedAt: bsdd.emittedAt,
      emittedBy: bsdd.emittedBy,
      emittedByEcoOrganisme: bsdd.emittedByEcoOrganisme,
      emitterCompanyAddress: bsdd.emitterCompanyAddress,
      emitterCompanyContact: bsdd.emitterCompanyContact,
      emitterCompanyMail: bsdd.emitterCompanyMail,
      emitterCompanyName: bsdd.emitterCompanyName,
      emitterCompanyOmiNumber: bsdd.emitterCompanyOmiNumber,
      emitterCompanyPhone: bsdd.emitterCompanyPhone,
      emitterCompanySiret: bsdd.emitterCompanySiret,
      emitterIsForeignShip: bsdd.emitterIsForeignShip,
      emitterIsPrivateIndividual: bsdd.emitterIsPrivateIndividual,
      emitterPickupSite: bsdd.emitterPickupSite,
      emitterType: bsdd.emitterType,
      emitterWorkSiteAddress: bsdd.emitterWorkSiteAddress,
      emitterWorkSiteCity: bsdd.emitterWorkSiteCity,
      emitterWorkSiteInfos: bsdd.emitterWorkSiteInfos,
      emitterWorkSiteName: bsdd.emitterWorkSiteName,
      emitterWorkSitePostalCode: bsdd.emitterWorkSitePostalCode,
      emptyReturnADR: bsdd.emptyReturnADR,
      finalOperations: bsdd.finalOperations.length
        ? {
            createMany: {
              data: bsdd.finalOperations!.map(t => {
                return { ...t, formId: undefined };
              })
            }
          }
        : undefined,
      hasCiterneBeenWashedOut: bsdd.hasCiterneBeenWashedOut,
      intermediaries: bsdd.intermediaries.length
        ? {
            createMany: {
              data: bsdd.intermediaries!.map(t => {
                return { ...t, formId: undefined };
              })
            }
          }
        : undefined,
      intermediariesSirets: bsdd.intermediariesSirets,
      isAccepted: bsdd.isAccepted,
      isDeleted: bsdd.isDeleted,
      isImportedFromPaper: bsdd.isImportedFromPaper,
      nextDestinationCompanyAddress: bsdd.nextDestinationCompanyAddress,
      nextDestinationCompanyContact: bsdd.nextDestinationCompanyContact,
      nextDestinationCompanyCountry: bsdd.nextDestinationCompanyCountry,
      nextDestinationCompanyExtraEuropeanId:
        bsdd.nextDestinationCompanyExtraEuropeanId,
      nextDestinationCompanyMail: bsdd.nextDestinationCompanyMail,
      nextDestinationCompanyName: bsdd.nextDestinationCompanyName,
      nextDestinationCompanyPhone: bsdd.nextDestinationCompanyPhone,
      nextDestinationCompanySiret: bsdd.nextDestinationCompanySiret,
      nextDestinationCompanyVatNumber: bsdd.nextDestinationCompanyVatNumber,
      nextDestinationNotificationNumber: bsdd.nextDestinationNotificationNumber,
      nextDestinationProcessingOperation:
        bsdd.nextDestinationProcessingOperation,
      nextTransporterOrgId: bsdd.nextTransporterOrgId,
      noTraceability: bsdd.noTraceability,
      processedAt: bsdd.processedAt,
      processedBy: bsdd.processedBy,
      processingOperationDescription: bsdd.processingOperationDescription,
      processingOperationDone: bsdd.processingOperationDone,
      quantityGrouped: bsdd.quantityGrouped,
      quantityReceived: bsdd.quantityReceived,
      quantityReceivedType: bsdd.quantityReceivedType,
      quantityRefused: bsdd.quantityRefused,
      receivedAt: bsdd.receivedAt,
      receivedBy: bsdd.receivedBy,
      recipientCap: bsdd.recipientCap,
      recipientCompanyAddress: bsdd.recipientCompanyAddress,
      recipientCompanyContact: bsdd.recipientCompanyContact,
      recipientCompanyMail: bsdd.recipientCompanyMail,
      recipientCompanyName: bsdd.recipientCompanyName,
      recipientCompanyPhone: bsdd.recipientCompanyPhone,
      recipientCompanySiret: bsdd.recipientCompanySiret,
      recipientIsTempStorage: bsdd.recipientIsTempStorage,
      recipientProcessingOperation: bsdd.recipientProcessingOperation,
      recipientsSirets: bsdd.recipientsSirets,
      sentAt: bsdd.sentAt,
      sentBy: bsdd.sentBy,
      signedAt: bsdd.signedAt,
      signedBy: bsdd.signedBy,
      signedByTransporter: bsdd.signedByTransporter,
      status: bsdd.status,
      takenOverAt: bsdd.takenOverAt,
      takenOverBy: bsdd.takenOverBy,
      traderCompanyAddress: bsdd.traderCompanyAddress,
      traderCompanyContact: bsdd.traderCompanyContact,
      traderCompanyMail: bsdd.traderCompanyMail,
      traderCompanyName: bsdd.traderCompanyName,
      traderCompanyPhone: bsdd.traderCompanyPhone,
      traderCompanySiret: bsdd.traderCompanySiret,
      traderDepartment: bsdd.traderDepartment,
      traderReceipt: bsdd.traderReceipt,
      traderValidityLimit: bsdd.traderValidityLimit,
      transporters: bsdd.transporters.length
        ? {
            createMany: {
              data: bsdd.transporters!.map((t, idx) => {
                const { id, ...data } = t;
                return { ...data, formId: undefined, number: idx + 1 };
              })
            }
          }
        : undefined,
      transportersSirets: bsdd.transportersSirets,
      updatedAt: bsdd.updatedAt,
      wasteAcceptationStatus: bsdd.wasteAcceptationStatus,
      wasteDetailsAnalysisReferences: bsdd.wasteDetailsAnalysisReferences,
      wasteDetailsCode: bsdd.wasteDetailsCode,
      wasteDetailsConsistence: bsdd.wasteDetailsConsistence,
      wasteDetailsIsDangerous: bsdd.wasteDetailsIsDangerous,
      wasteDetailsLandIdentifiers: bsdd.wasteDetailsLandIdentifiers,
      wasteDetailsName: bsdd.wasteDetailsName,
      wasteDetailsOnuCode: bsdd.wasteDetailsOnuCode,
      wasteDetailsPackagingInfos: prismaJsonNoNull(
        bsdd.wasteDetailsPackagingInfos
      ),
      wasteDetailsParcelNumbers: prismaJsonNoNull(
        bsdd.wasteDetailsParcelNumbers
      ),
      wasteDetailsPop: bsdd.wasteDetailsPop,
      wasteDetailsQuantity: bsdd.wasteDetailsQuantity,
      wasteDetailsQuantityType: bsdd.wasteDetailsQuantityType,
      wasteDetailsSampleNumber: bsdd.wasteDetailsSampleNumber,
      wasteRefusalReason: bsdd.wasteRefusalReason
    };

    console.log("newBsddCreateInput", newBsddCreateInput);

    const newBsdd = await create(newBsddCreateInput);

    console.log("newBsdd", newBsdd);

    return newBsdd;
  });
};
