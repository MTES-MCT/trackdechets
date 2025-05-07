import { Form, Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { getFormRepository } from "../../../../forms/repository";
import { prismaJsonNoNull } from "../../../../common/converter";
import { FormWithTransporters } from "../../../../forms/types";
import { UserInputError } from "../../../../common/errors";
import { getBsdaRepository } from "../../../../bsda/repository";
import { getBsdasriRepository } from "../../../../bsdasris/repository";
import { getBsffRepository } from "../../../../bsffs/repository";
import { getBsvhuRepository } from "../../../../bsvhu/repository";
import { getBspaohRepository } from "../../../../bspaoh/repository";

export const bsdaInclude = {
  transporters: true,
  intermediaries: true,
  finalOperations: true,
  grouping: true,
  groupedIn: true,
  forwarding: true,
  forwardedIn: true
};

export const cloneBsda = async (user: Express.User, id: string) => {
  const bsda = await prisma.bsda.findFirstOrThrow({
    where: { id },
    include: bsdaInclude
  });

  if (!bsda) {
    throw new UserInputError(`ID invalide ${id}`);
  }

  if (
    bsda.grouping?.length ||
    bsda.groupedIn ||
    bsda.forwarding ||
    bsda.forwardedIn
  ) {
    throw new UserInputError(
      "Impossible de cloner ce type de BSD pour le moment"
    );
  }

  const { create } = getBsdaRepository(user);

  const newBsdaCreateInput: Omit<
    Required<Prisma.BsdaCreateInput>,
    // Ignored for the time being
    | "rowNumber"
    | "bsdaRevisionRequests"
    | "FinalOperationToFinalForm"
    | "forwardedIn"
    | "forwarding"
    | "groupedIn"
    | "grouping"
    | "rowNumber"
    // Done manually
    // TODO(registry): clone associated registryLookup
    | "finalOperations"
    | "registryLookups"
  > = {
    id: getReadableId(ReadableIdPrefix.BSDA),
    isDuplicateOf: null,
    brokerCompanyAddress: bsda.brokerCompanyAddress,
    brokerCompanyContact: bsda.brokerCompanyContact,
    brokerCompanyMail: bsda.brokerCompanyMail,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanyPhone: bsda.brokerCompanyPhone,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseDepartment: bsda.brokerRecepisseDepartment,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    brokerRecepisseValidityLimit: bsda.brokerRecepisseValidityLimit,
    canAccessDraftOrgIds: bsda.canAccessDraftOrgIds,
    createdAt: bsda.createdAt,
    destinationCap: bsda.destinationCap,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    destinationCompanyContact: bsda.destinationCompanyContact,
    destinationCompanyMail: bsda.destinationCompanyMail,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanyPhone: bsda.destinationCompanyPhone,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationCustomInfo: bsda.destinationCustomInfo,
    destinationOperationCode: bsda.destinationOperationCode,
    destinationOperationDate: bsda.destinationOperationDate,
    destinationOperationDescription: bsda.destinationOperationDescription,
    destinationOperationMode: bsda.destinationOperationMode,
    destinationOperationNextDestinationCap:
      bsda.destinationOperationNextDestinationCap,
    destinationOperationNextDestinationCompanyAddress:
      bsda.destinationOperationNextDestinationCompanyAddress,
    destinationOperationNextDestinationCompanyContact:
      bsda.destinationOperationNextDestinationCompanyContact,
    destinationOperationNextDestinationCompanyMail:
      bsda.destinationOperationNextDestinationCompanyMail,
    destinationOperationNextDestinationCompanyName:
      bsda.destinationOperationNextDestinationCompanyName,
    destinationOperationNextDestinationCompanyPhone:
      bsda.destinationOperationNextDestinationCompanyPhone,
    destinationOperationNextDestinationCompanySiret:
      bsda.destinationOperationNextDestinationCompanySiret,
    destinationOperationNextDestinationCompanyVatNumber:
      bsda.destinationOperationNextDestinationCompanyVatNumber,
    destinationOperationNextDestinationPlannedOperationCode:
      bsda.destinationOperationNextDestinationPlannedOperationCode,
    destinationOperationSignatureAuthor:
      bsda.destinationOperationSignatureAuthor,
    destinationOperationSignatureDate: bsda.destinationOperationSignatureDate,
    destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    destinationReceptionDate: bsda.destinationReceptionDate,
    destinationReceptionRefusalReason: bsda.destinationReceptionRefusalReason,
    destinationReceptionWeight: bsda.destinationReceptionWeight,
    ecoOrganismeName: bsda.ecoOrganismeName,
    ecoOrganismeSiret: bsda.ecoOrganismeSiret,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterCompanyContact: bsda.emitterCompanyContact,
    emitterCompanyMail: bsda.emitterCompanyMail,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanyPhone: bsda.emitterCompanyPhone,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCustomInfo: bsda.emitterCustomInfo,
    emitterEmissionSignatureAuthor: bsda.emitterEmissionSignatureAuthor,
    emitterEmissionSignatureDate: bsda.emitterEmissionSignatureDate,
    emitterIsPrivateIndividual: bsda.emitterIsPrivateIndividual,
    emitterPickupSiteAddress: bsda.emitterPickupSiteAddress,
    emitterPickupSiteCity: bsda.emitterPickupSiteCity,
    emitterPickupSiteInfos: bsda.emitterPickupSiteInfos,
    emitterPickupSiteName: bsda.emitterPickupSiteName,
    emitterPickupSitePostalCode: bsda.emitterPickupSitePostalCode,
    intermediaries: bsda.intermediaries.length
      ? {
          createMany: {
            data: bsda.intermediaries
          }
        }
      : {},
    intermediariesOrgIds: bsda.intermediariesOrgIds,
    isDeleted: bsda.isDeleted,
    isDraft: bsda.isDraft,
    packagings: prismaJsonNoNull(bsda.packagings),
    status: bsda.status,
    transporters: bsda.transporters.length
      ? {
          createMany: {
            data: bsda.transporters!.map((t, idx) => {
              const { id, ...data } = t;
              return { ...data, bsdaId: undefined, number: idx + 1 };
            })
          }
        }
      : {},
    transportersOrgIds: bsda.transportersOrgIds,
    transporterTransportSignatureDate: bsda.transporterTransportSignatureDate,
    type: bsda.type,
    updatedAt: bsda.updatedAt,
    wasteAdr: bsda.wasteAdr,
    wasteNonRoadRegulationMention: bsda.wasteNonRoadRegulationMention,
    wasteCode: bsda.wasteCode,
    wasteConsistence: bsda.wasteConsistence,
    wasteFamilyCode: bsda.wasteFamilyCode,
    wasteMaterialName: bsda.wasteMaterialName,
    wastePop: bsda.wastePop,
    wasteSealNumbers: bsda.wasteSealNumbers,
    weightIsEstimate: bsda.weightIsEstimate,
    weightValue: bsda.weightValue,
    workerCertificationCertificationNumber:
      bsda.workerCertificationCertificationNumber,
    workerCertificationHasSubSectionFour:
      bsda.workerCertificationHasSubSectionFour,
    workerCertificationHasSubSectionThree:
      bsda.workerCertificationHasSubSectionThree,
    workerCertificationOrganisation: bsda.workerCertificationOrganisation,
    workerCertificationValidityLimit: bsda.workerCertificationValidityLimit,
    workerCompanyAddress: bsda.workerCompanyAddress,
    workerCompanyContact: bsda.workerCompanyContact,
    workerCompanyMail: bsda.workerCompanyMail,
    workerCompanyName: bsda.workerCompanyName,
    workerCompanyPhone: bsda.workerCompanyPhone,
    workerCompanySiret: bsda.workerCompanySiret,
    workerIsDisabled: bsda.workerIsDisabled,
    workerWorkHasEmitterPaperSignature: bsda.workerWorkHasEmitterPaperSignature,
    workerWorkSignatureAuthor: bsda.workerWorkSignatureAuthor,
    workerWorkSignatureDate: bsda.workerWorkSignatureDate
  };

  const newBsda = await create(newBsdaCreateInput);

  // Final operations
  for await (const operation of bsda.finalOperations) {
    const finalOperation: Prisma.BsdaFinalOperationCreateInput = {
      initialBsda: { connect: { id: newBsda.id } },
      finalBsda: { connect: { id: newBsda.id } },
      operationCode: operation.operationCode,
      quantity: operation.quantity
    };

    await prisma.bsdaFinalOperation.create({
      data: finalOperation
    });
  }

  return newBsda;
};

export const bsdasriInclude = {
  finalOperations: true,
  grouping: true,
  groupedIn: true,
  synthesizedIn: true,
  synthesizing: true
};

export const cloneBsdasri = async (user: Express.User, id: string) => {
  const bsdasri = await prisma.bsdasri.findFirstOrThrow({
    where: { id },
    include: bsdasriInclude
  });

  if (!bsdasri) {
    throw new UserInputError(`ID invalide ${id}`);
  }

  if (
    bsdasri.grouping?.length ||
    bsdasri.groupedIn ||
    bsdasri.synthesizedInId ||
    bsdasri.synthesizedIn ||
    bsdasri.synthesizing.length
  ) {
    throw new UserInputError(
      "Impossible de cloner ce type de BSD pour le moment"
    );
  }

  const { create } = getBsdasriRepository(user);

  const newBsdasriCreateInput: Omit<
    Required<Prisma.BsdasriCreateInput>,
    // Ignored for the time being
    | "bsdasriRevisionRequests"
    | "FinalOperationToFinalBsdasri"
    | "groupedIn"
    | "grouping"
    | "synthesizedIn"
    | "synthesizing"
    | "rowNumber"
    // Done manually
    | "finalOperations"
    | "registryLookups"
  > = {
    id: getReadableId(ReadableIdPrefix.DASRI),
    createdAt: bsdasri.createdAt,
    isDuplicateOf: null,
    destinationCompanyAddress: bsdasri.destinationCompanyAddress,
    destinationCompanyContact: bsdasri.destinationCompanyContact,
    destinationCompanyMail: bsdasri.destinationCompanyMail,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanyPhone: bsdasri.destinationCompanyPhone,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    destinationCustomInfo: bsdasri.destinationCustomInfo,
    destinationOperationCode: bsdasri.destinationOperationCode,
    destinationOperationDate: bsdasri.destinationOperationDate,
    destinationOperationMode: bsdasri.destinationOperationMode,
    destinationOperationSignatureAuthor:
      bsdasri.destinationOperationSignatureAuthor,
    destinationOperationSignatureDate:
      bsdasri.destinationOperationSignatureDate,
    destinationReceptionAcceptationStatus:
      bsdasri.destinationReceptionAcceptationStatus,
    destinationReceptionDate: bsdasri.destinationReceptionDate,
    destinationReceptionSignatureAuthor:
      bsdasri.destinationReceptionSignatureAuthor,
    destinationReceptionSignatureDate:
      bsdasri.destinationReceptionSignatureDate,
    destinationReceptionWasteRefusalReason:
      bsdasri.destinationReceptionWasteRefusalReason,
    destinationReceptionWasteRefusedWeightValue:
      bsdasri.destinationReceptionWasteRefusedWeightValue,
    destinationReceptionWasteVolume: bsdasri.destinationReceptionWasteVolume,
    destinationReceptionWasteWeightValue:
      bsdasri.destinationReceptionWasteWeightValue,
    destinationWastePackagings: prismaJsonNoNull(
      bsdasri.destinationWastePackagings
    ),
    ecoOrganismeName: bsdasri.ecoOrganismeName,
    ecoOrganismeSiret: bsdasri.ecoOrganismeSiret,
    emissionSignatory: bsdasri.emissionSignatoryId
      ? {
          connect: {
            id: bsdasri.emissionSignatoryId
          }
        }
      : {},
    emittedByEcoOrganisme: bsdasri.emittedByEcoOrganisme,
    emitterCompanyAddress: bsdasri.emitterCompanyAddress,
    emitterCompanyContact: bsdasri.emitterCompanyContact,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanyPhone: bsdasri.emitterCompanyPhone,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    emitterCustomInfo: bsdasri.emitterCustomInfo,
    emitterEmissionSignatureAuthor: bsdasri.emitterEmissionSignatureAuthor,
    emitterEmissionSignatureDate: bsdasri.emitterEmissionSignatureDate,
    emitterPickupSiteAddress: bsdasri.emitterPickupSiteAddress,
    emitterPickupSiteCity: bsdasri.emitterPickupSiteCity,
    emitterPickupSiteInfos: bsdasri.emitterPickupSiteInfos,
    emitterPickupSiteName: bsdasri.emitterPickupSiteName,
    emitterPickupSitePostalCode: bsdasri.emitterPickupSitePostalCode,
    emitterWastePackagings: prismaJsonNoNull(bsdasri.emitterWastePackagings),
    emitterWasteVolume: bsdasri.emitterWasteVolume,
    emitterWasteWeightIsEstimate: bsdasri.emitterWasteWeightIsEstimate,
    emitterWasteWeightValue: bsdasri.emitterWasteWeightValue,
    groupingEmitterSirets: bsdasri.groupingEmitterSirets,
    handedOverToRecipientAt: bsdasri.handedOverToRecipientAt,
    identificationNumbers: bsdasri.identificationNumbers,
    isDeleted: bsdasri.isDeleted,
    isDraft: bsdasri.isDraft,
    isEmissionDirectTakenOver: bsdasri.isEmissionDirectTakenOver,
    isEmissionTakenOverWithSecretCode:
      bsdasri.isEmissionTakenOverWithSecretCode,
    operationSignatory: bsdasri.operationSignatoryId
      ? {
          connect: {
            id: bsdasri.operationSignatoryId
          }
        }
      : {},
    receptionSignatory: bsdasri.receptionSignatoryId
      ? {
          connect: {
            id: bsdasri.receptionSignatoryId
          }
        }
      : {},
    status: bsdasri.status,
    synthesisEmitterSirets: bsdasri.synthesisEmitterSirets,
    transporterAcceptationStatus: bsdasri.transporterAcceptationStatus,
    transporterCompanyAddress: bsdasri.transporterCompanyAddress,
    transporterCompanyContact: bsdasri.transporterCompanyContact,
    transporterCompanyMail: bsdasri.transporterCompanyMail,
    transporterCompanyName: bsdasri.transporterCompanyName,
    transporterCompanyPhone: bsdasri.transporterCompanyPhone,
    transporterCompanySiret: bsdasri.transporterCompanySiret,
    transporterCompanyVatNumber: bsdasri.transporterCompanyVatNumber,
    transporterCustomInfo: bsdasri.transporterCustomInfo,
    transporterRecepisseDepartment: bsdasri.transporterRecepisseDepartment,
    transporterRecepisseIsExempted: bsdasri.transporterRecepisseIsExempted,
    transporterRecepisseNumber: bsdasri.transporterRecepisseNumber,
    transporterRecepisseValidityLimit:
      bsdasri.transporterRecepisseValidityLimit,
    transporterTakenOverAt: bsdasri.transporterTakenOverAt,
    transporterTransportMode: bsdasri.transporterTransportMode,
    transporterTransportPlates: bsdasri.transporterTransportPlates,
    transporterTransportSignatureAuthor:
      bsdasri.transporterTransportSignatureAuthor,
    transporterTransportSignatureDate:
      bsdasri.transporterTransportSignatureDate,
    transporterWastePackagings: prismaJsonNoNull(
      bsdasri.transporterWastePackagings
    ),
    transporterWasteRefusalReason: bsdasri.transporterWasteRefusalReason,
    transporterWasteRefusedWeightValue:
      bsdasri.transporterWasteRefusedWeightValue,
    transporterWasteVolume: bsdasri.transporterWasteVolume,
    transporterWasteWeightIsEstimate: bsdasri.transporterWasteWeightIsEstimate,
    transporterWasteWeightValue: bsdasri.transporterWasteWeightValue,
    transportSignatory: bsdasri.transportSignatoryId
      ? {
          connect: {
            id: bsdasri.transportSignatoryId
          }
        }
      : {},
    type: bsdasri.type,
    updatedAt: bsdasri.updatedAt,
    wasteAdr: bsdasri.wasteAdr,
    wasteCode: bsdasri.wasteCode,
    canAccessDraftOrgIds: bsdasri.canAccessDraftOrgIds
  };

  const newBsdasri = await create(newBsdasriCreateInput);

  // Final operations
  for await (const operation of bsdasri.finalOperations) {
    const finalOperation: Prisma.BsdasriFinalOperationCreateInput = {
      initialBsdasri: { connect: { id: newBsdasri.id } },
      finalBsdasri: { connect: { id: newBsdasri.id } },
      operationCode: operation.operationCode,
      quantity: operation.quantity
    };

    await prisma.bsdasriFinalOperation.create({
      data: finalOperation
    });
  }

  return newBsdasri;
};

export const bsffInclude = {
  transporters: true,
  ficheInterventions: true,
  packagings: true
};

export const cloneBsff = async (user: Express.User, id: string) => {
  const bsff = await prisma.bsff.findFirstOrThrow({
    where: { id },
    include: bsffInclude
  });

  if (!bsff) {
    throw new UserInputError(`ID invalide ${id}`);
  }

  if (bsff.packagings?.some(packaging => packaging.nextPackagingId)) {
    throw new UserInputError(
      "Impossible de cloner ce type de BSD pour le moment"
    );
  }

  const { create } = getBsffRepository(user);

  const newBsffCreateInput: Omit<
    Required<Prisma.BsffCreateInput>,
    // Ignored for the time being
    "rowNumber" | "registryLookups"
  > = {
    id: getReadableId(ReadableIdPrefix.FF),
    createdAt: bsff.createdAt,
    destinationCap: bsff.destinationCap,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationCompanyContact: bsff.destinationCompanyContact,
    destinationCompanyMail: bsff.destinationCompanyMail,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanyPhone: bsff.destinationCompanyPhone,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationCustomInfo: bsff.destinationCustomInfo,
    destinationPlannedOperationCode: bsff.destinationPlannedOperationCode,
    destinationReceptionDate: bsff.destinationReceptionDate,
    destinationReceptionSignatureAuthor:
      bsff.destinationReceptionSignatureAuthor,
    destinationReceptionSignatureDate: bsff.destinationReceptionSignatureDate,
    detenteurCompanySirets: bsff.detenteurCompanySirets,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterCompanyContact: bsff.emitterCompanyContact,
    emitterCompanyMail: bsff.emitterCompanyMail,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanyPhone: bsff.emitterCompanyPhone,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterCustomInfo: bsff.emitterCustomInfo,
    emitterEmissionSignatureAuthor: bsff.emitterEmissionSignatureAuthor,
    emitterEmissionSignatureDate: bsff.emitterEmissionSignatureDate,
    ficheInterventions: bsff.ficheInterventions.length
      ? {
          create: {
            ...bsff.ficheInterventions[0],
            id: undefined
          }
        }
      : {},
    isDeleted: bsff.isDeleted,
    isDraft: bsff.isDraft,
    isDuplicateOf: null,
    packagings: bsff.packagings.length
      ? {
          createMany: {
            data: bsff.packagings!.map(t => {
              const { id, bsffId, ...data } = t;
              return data;
            })
          }
        }
      : {},
    status: bsff.status,
    transporters: bsff.transporters.length
      ? {
          createMany: {
            data: bsff.transporters!.map((t, idx) => {
              const { id, bsffId, ...data } = t;
              return { ...data, number: idx + 1 };
            })
          }
        }
      : {},
    transportersOrgIds: bsff.transportersOrgIds,
    transporterTransportSignatureDate: bsff.transporterTransportSignatureDate,
    type: bsff.type,
    updatedAt: bsff.updatedAt,
    wasteAdr: bsff.wasteAdr,
    wasteCode: bsff.wasteCode,
    wasteDescription: bsff.wasteDescription,
    weightIsEstimate: bsff.weightIsEstimate,
    canAccessDraftOrgIds: [], // filled in repository
    weightValue: bsff.weightValue
  };

  const newBsff = await create({ data: newBsffCreateInput });

  // Final operations in packagings
  const initialBsffPackagings = await prisma.bsffPackaging.findMany({
    where: { bsffId: bsff.id },
    include: { finalOperations: true }
  });
  const newBsffPackagings = await prisma.bsffPackaging.findMany({
    where: { bsffId: newBsff.id }
  });

  for (let i = 0; i < initialBsffPackagings.length; i++) {
    if (initialBsffPackagings[i].finalOperations.length) {
      for await (const finalOperation of initialBsffPackagings[i]
        .finalOperations) {
        const finalOperationCreateInput: Prisma.BsffPackagingFinalOperationCreateInput =
          {
            initialBsffPackaging: { connect: { id: newBsffPackagings[i].id } },
            finalBsffPackaging: { connect: { id: newBsffPackagings[i].id } },
            quantity: finalOperation.quantity,
            noTraceability: finalOperation.noTraceability,
            operationCode: finalOperation.operationCode
          };

        await prisma.bsffPackagingFinalOperation.create({
          data: finalOperationCreateInput
        });
      }
    }
  }

  return newBsff;
};

export const bsvhuInclude = {
  intermediaries: true
};

export const cloneBsvhu = async (user: Express.User, id: string) => {
  const bsvhu = await prisma.bsvhu.findFirstOrThrow({
    where: { id },
    include: bsvhuInclude
  });

  if (!bsvhu) {
    throw new UserInputError(`ID invalide ${id}`);
  }

  const { create } = getBsvhuRepository(user);

  const newBsvhuCreateInput: Omit<
    Required<Prisma.BsvhuCreateInput>,
    // Ignored for the time being
    "rowNumber" | "registryLookups"
  > = {
    id: getReadableId(ReadableIdPrefix.VHU),
    createdAt: bsvhu.createdAt,
    customId: null,
    isDuplicateOf: null,
    destinationAgrementNumber: bsvhu.destinationAgrementNumber,
    destinationCompanyAddress: bsvhu.destinationCompanyAddress,
    destinationCompanyContact: bsvhu.destinationCompanyContact,
    destinationCompanyMail: bsvhu.destinationCompanyMail,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanyPhone: bsvhu.destinationCompanyPhone,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationCustomInfo: bsvhu.destinationCustomInfo,
    destinationOperationCode: bsvhu.destinationOperationCode,
    destinationOperationDate: bsvhu.destinationOperationDate,
    destinationOperationMode: bsvhu.destinationOperationMode,
    destinationOperationNextDestinationCompanyAddress:
      bsvhu.destinationOperationNextDestinationCompanyAddress,
    destinationOperationNextDestinationCompanyContact:
      bsvhu.destinationOperationNextDestinationCompanyContact,
    destinationOperationNextDestinationCompanyMail:
      bsvhu.destinationOperationNextDestinationCompanyMail,
    destinationOperationNextDestinationCompanyName:
      bsvhu.destinationOperationNextDestinationCompanyName,
    destinationOperationNextDestinationCompanyPhone:
      bsvhu.destinationOperationNextDestinationCompanyPhone,
    destinationOperationNextDestinationCompanySiret:
      bsvhu.destinationOperationNextDestinationCompanySiret,
    destinationOperationNextDestinationCompanyVatNumber:
      bsvhu.destinationOperationNextDestinationCompanyVatNumber,
    destinationOperationSignatureAuthor:
      bsvhu.destinationOperationSignatureAuthor,
    destinationOperationSignatureDate: bsvhu.destinationOperationSignatureDate,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    destinationReceptionIdentificationNumbers:
      bsvhu.destinationReceptionIdentificationNumbers,
    destinationReceptionIdentificationType:
      bsvhu.destinationReceptionIdentificationType,
    destinationReceptionQuantity: bsvhu.destinationReceptionQuantity,
    destinationReceptionRefusalReason: bsvhu.destinationReceptionRefusalReason,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight,
    destinationType: bsvhu.destinationType,
    emitterAgrementNumber: bsvhu.emitterAgrementNumber,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterCompanyCity: bsvhu.emitterCompanyCity,
    emitterCompanyContact: bsvhu.emitterCompanyContact,
    emitterCompanyCountry: bsvhu.emitterCompanyCountry,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanyPhone: bsvhu.emitterCompanyPhone,
    emitterCompanyPostalCode: bsvhu.emitterCompanyPostalCode,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyStreet: bsvhu.emitterCompanyStreet,
    emitterCustomInfo: bsvhu.emitterCustomInfo,
    emitterEmissionSignatureAuthor: bsvhu.emitterEmissionSignatureAuthor,
    emitterEmissionSignatureDate: bsvhu.emitterEmissionSignatureDate,
    emitterIrregularSituation: bsvhu.emitterIrregularSituation,
    emitterNoSiret: bsvhu.emitterNoSiret,
    emitterNotOnTD: bsvhu.emitterNotOnTD,
    identificationNumbers: bsvhu.identificationNumbers,
    identificationType: bsvhu.identificationType,
    intermediaries: bsvhu.intermediaries.length
      ? {
          createMany: {
            data: bsvhu.intermediaries
          }
        }
      : {},
    intermediariesOrgIds: bsvhu.intermediariesOrgIds,
    canAccessDraftOrgIds: bsvhu.canAccessDraftOrgIds,
    isDeleted: bsvhu.isDeleted,
    isDraft: bsvhu.isDraft,
    packaging: bsvhu.packaging,
    quantity: bsvhu.quantity,
    status: bsvhu.status,
    transporterCompanyAddress: bsvhu.transporterCompanyAddress,
    transporterCompanyContact: bsvhu.transporterCompanyContact,
    transporterCompanyMail: bsvhu.transporterCompanyMail,
    transporterCompanyName: bsvhu.transporterCompanyName,
    transporterCompanyPhone: bsvhu.transporterCompanyPhone,
    transporterCompanySiret: bsvhu.transporterCompanySiret,
    transporterCompanyVatNumber: bsvhu.transporterCompanyVatNumber,
    transporterCustomInfo: bsvhu.transporterCustomInfo,
    transporterRecepisseDepartment: bsvhu.transporterRecepisseDepartment,
    transporterRecepisseIsExempted: bsvhu.transporterRecepisseIsExempted,
    transporterRecepisseNumber: bsvhu.transporterRecepisseNumber,
    transporterRecepisseValidityLimit: bsvhu.transporterRecepisseValidityLimit,
    transporterTransportMode: bsvhu.transporterTransportMode,
    transporterTransportPlates: bsvhu.transporterTransportPlates,
    transporterTransportSignatureAuthor:
      bsvhu.transporterTransportSignatureAuthor,
    transporterTransportSignatureDate: bsvhu.transporterTransportSignatureDate,
    transporterTransportTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    brokerCompanyName: bsvhu.brokerCompanyName,
    brokerCompanySiret: bsvhu.brokerCompanySiret,
    brokerCompanyAddress: bsvhu.brokerCompanyAddress,
    brokerCompanyContact: bsvhu.brokerCompanyContact,
    brokerCompanyPhone: bsvhu.brokerCompanyPhone,
    brokerCompanyMail: bsvhu.brokerCompanyMail,
    brokerRecepisseNumber: bsvhu.brokerRecepisseNumber,
    brokerRecepisseDepartment: bsvhu.brokerRecepisseDepartment,
    brokerRecepisseValidityLimit: bsvhu.brokerRecepisseValidityLimit,
    traderCompanyName: bsvhu.traderCompanyName,
    traderCompanySiret: bsvhu.traderCompanySiret,
    traderCompanyAddress: bsvhu.traderCompanyAddress,
    traderCompanyContact: bsvhu.traderCompanyContact,
    traderCompanyPhone: bsvhu.traderCompanyPhone,
    traderCompanyMail: bsvhu.traderCompanyMail,
    traderRecepisseNumber: bsvhu.traderRecepisseNumber,
    traderRecepisseDepartment: bsvhu.traderRecepisseDepartment,
    traderRecepisseValidityLimit: bsvhu.traderRecepisseValidityLimit,
    updatedAt: bsvhu.updatedAt,
    wasteCode: bsvhu.wasteCode,
    weightIsEstimate: bsvhu.weightIsEstimate,
    weightValue: bsvhu.weightValue,
    ecoOrganismeName: bsvhu.ecoOrganismeName,
    ecoOrganismeSiret: bsvhu.ecoOrganismeSiret,
    destinationReceptionSignatureAuthor:
      bsvhu.destinationReceptionSignatureAuthor,
    destinationReceptionSignatureDate: bsvhu.destinationReceptionSignatureDate,
    containsElectricOrHybridVehicles: bsvhu.containsElectricOrHybridVehicles
  };

  const newBsvhu = await create(newBsvhuCreateInput);

  return newBsvhu;
};

export const bspaohInclude = {
  transporters: true
};

export const cloneBspaoh = async (user: Express.User, id: string) => {
  const bspaoh = await prisma.bspaoh.findFirstOrThrow({
    where: { id },
    include: bspaohInclude
  });

  if (!bspaoh) {
    throw new UserInputError(`ID invalide ${id}`);
  }

  const { create } = getBspaohRepository(user);

  const newBspaohCreateInput: Omit<
    Required<Prisma.BspaohCreateInput>,
    // Ignored for the time being
    "rowNumber" | "registryLookups"
  > = {
    id: getReadableId(ReadableIdPrefix.PAOH),
    canAccessDraftSirets: bspaoh.canAccessDraftSirets,
    createdAt: bspaoh.createdAt,
    isDuplicateOf: null,
    currentTransporterOrgId: bspaoh.currentTransporterOrgId,
    destinationCap: bspaoh.destinationCap,
    destinationCompanyAddress: bspaoh.destinationCompanyAddress,
    destinationCompanyContact: bspaoh.destinationCompanyContact,
    destinationCompanyMail: bspaoh.destinationCompanyMail,
    destinationCompanyName: bspaoh.destinationCompanyName,
    destinationCompanyPhone: bspaoh.destinationCompanyPhone,
    destinationCompanySiret: bspaoh.destinationCompanySiret,
    destinationCustomInfo: bspaoh.destinationCustomInfo,
    destinationOperationCode: bspaoh.destinationOperationCode,
    destinationOperationDate: bspaoh.destinationOperationDate,
    destinationOperationSignatureAuthor:
      bspaoh.destinationOperationSignatureAuthor,
    destinationOperationSignatureDate: bspaoh.destinationOperationSignatureDate,
    destinationReceptionAcceptationStatus:
      bspaoh.destinationReceptionAcceptationStatus,
    destinationReceptionDate: bspaoh.destinationReceptionDate,
    destinationReceptionSignatureAuthor:
      bspaoh.destinationReceptionSignatureAuthor,
    destinationReceptionSignatureDate: bspaoh.destinationReceptionSignatureDate,
    destinationReceptionWasteAcceptedWeightValue:
      bspaoh.destinationReceptionWasteAcceptedWeightValue,
    destinationReceptionWastePackagingsAcceptation: prismaJsonNoNull(
      bspaoh.destinationReceptionWastePackagingsAcceptation
    ),
    destinationReceptionWasteQuantityValue:
      bspaoh.destinationReceptionWasteQuantityValue,
    destinationReceptionWasteReceivedWeightValue:
      bspaoh.destinationReceptionWasteReceivedWeightValue,
    destinationReceptionWasteRefusalReason:
      bspaoh.destinationReceptionWasteRefusalReason,
    destinationReceptionWasteRefusedWeightValue:
      bspaoh.destinationReceptionWasteRefusedWeightValue,
    emitterCompanyAddress: bspaoh.emitterCompanyAddress,
    emitterCompanyContact: bspaoh.emitterCompanyContact,
    emitterCompanyMail: bspaoh.emitterCompanyMail,
    emitterCompanyName: bspaoh.emitterCompanyName,
    emitterCompanyPhone: bspaoh.emitterCompanyPhone,
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    emitterCustomInfo: bspaoh.emitterCustomInfo,
    emitterEmissionSignatureAuthor: bspaoh.emitterEmissionSignatureAuthor,
    emitterEmissionSignatureDate: bspaoh.emitterEmissionSignatureDate,
    emitterPickupSiteAddress: bspaoh.emitterPickupSiteAddress,
    emitterPickupSiteCity: bspaoh.emitterPickupSiteCity,
    emitterPickupSiteInfos: bspaoh.emitterPickupSiteInfos,
    emitterPickupSiteName: bspaoh.emitterPickupSiteName,
    emitterPickupSitePostalCode: bspaoh.emitterPickupSitePostalCode,
    emitterWasteQuantityValue: bspaoh.emitterWasteQuantityValue,
    emitterWasteWeightIsEstimate: bspaoh.emitterWasteWeightIsEstimate,
    emitterWasteWeightValue: bspaoh.emitterWasteWeightValue,
    handedOverToDestinationSignatureAuthor:
      bspaoh.handedOverToDestinationSignatureAuthor,
    handedOverToDestinationSignatureDate:
      bspaoh.handedOverToDestinationSignatureDate,
    isDeleted: bspaoh.isDeleted,
    nextTransporterOrgId: bspaoh.nextTransporterOrgId,
    status: bspaoh.status,
    transporters: bspaoh.transporters.length
      ? {
          createMany: {
            data: bspaoh.transporters!.map((t, idx) => {
              const { id, ...data } = t;
              return { ...data, bspaohId: undefined, number: idx + 1 };
            })
          }
        }
      : {},
    transportersSirets: bspaoh.transportersSirets,
    transporterTransportTakenOverAt: bspaoh.transporterTransportTakenOverAt,
    updatedAt: bspaoh.updatedAt,
    wasteAdr: bspaoh.wasteAdr,
    wasteCode: bspaoh.wasteCode,
    wastePackagings: prismaJsonNoNull(bspaoh.wastePackagings),
    wasteType: bspaoh.wasteType
  };

  const newBspaoh = await create(newBspaohCreateInput);

  return newBspaoh;
};

export const bsddInclude = {
  transporters: true,
  intermediaries: true,
  finalOperations: true,
  grouping: true,
  groupedIn: true,
  forwarding: true
};

export const cloneBsdd = async (
  user: Express.User,
  id: string
): Promise<Form & FormWithTransporters> => {
  const bsdd = await prisma.form.findFirstOrThrow({
    where: { id },
    include: bsddInclude
  });

  if (!bsdd) {
    throw new UserInputError(`ID invalide ${id}`);
  }

  if (
    bsdd.grouping?.length ||
    bsdd.groupedIn?.length ||
    bsdd.forwarding ||
    bsdd.forwardedInId
  ) {
    throw new UserInputError(
      "Impossible de cloner ce type de BSD pour le moment"
    );
  }

  const { create } = getFormRepository(user);

  const newBsddCreateInput: Omit<
    Required<Prisma.FormCreateInput>,
    // Ignored for the time being
    | "FinalOperationToFinalForm"
    | "forwardedIn"
    | "forwarding"
    | "groupedIn"
    | "grouping"
    | "id"
    | "rowNumber"
    | "StatusLog"
    | "bsddRevisionRequests"
    // Done manually
    | "finalOperations"
    | "registryLookups"
  > = {
    owner: {
      connect: {
        id: bsdd.ownerId
      }
    },
    readableId: getReadableId(),
    isDuplicateOf: null,
    brokerCompanyAddress: bsdd.brokerCompanyAddress,
    brokerCompanyContact: bsdd.brokerCompanyContact,
    brokerCompanyMail: bsdd.brokerCompanyMail,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanyPhone: bsdd.brokerCompanyPhone,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerDepartment: bsdd.brokerDepartment,
    brokerReceipt: bsdd.brokerReceipt,
    brokerValidityLimit: bsdd.brokerValidityLimit,
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
    hasCiterneBeenWashedOut: bsdd.hasCiterneBeenWashedOut,
    intermediaries: bsdd.intermediaries.length
      ? {
          createMany: {
            data: bsdd.intermediaries
          }
        }
      : {},
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
    nextDestinationProcessingOperation: bsdd.nextDestinationProcessingOperation,
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
      : {},
    transportersSirets: bsdd.transportersSirets,
    updatedAt: bsdd.updatedAt,
    wasteAcceptationStatus: bsdd.wasteAcceptationStatus,
    wasteDetailsAnalysisReferences: bsdd.wasteDetailsAnalysisReferences,
    wasteDetailsCode: bsdd.wasteDetailsCode,
    wasteDetailsIsSubjectToADR: bsdd.wasteDetailsIsSubjectToADR,
    wasteDetailsConsistence: bsdd.wasteDetailsConsistence,
    wasteDetailsIsDangerous: bsdd.wasteDetailsIsDangerous,
    wasteDetailsLandIdentifiers: bsdd.wasteDetailsLandIdentifiers,
    wasteDetailsName: bsdd.wasteDetailsName,
    wasteDetailsOnuCode: bsdd.wasteDetailsOnuCode,
    wasteDetailsNonRoadRegulationMention:
      bsdd.wasteDetailsNonRoadRegulationMention,
    wasteDetailsPackagingInfos: prismaJsonNoNull(
      bsdd.wasteDetailsPackagingInfos
    ),
    wasteDetailsParcelNumbers: prismaJsonNoNull(bsdd.wasteDetailsParcelNumbers),
    wasteDetailsPop: bsdd.wasteDetailsPop,
    wasteDetailsQuantity: bsdd.wasteDetailsQuantity,
    wasteDetailsQuantityType: bsdd.wasteDetailsQuantityType,
    wasteDetailsSampleNumber: bsdd.wasteDetailsSampleNumber,
    wasteRefusalReason: bsdd.wasteRefusalReason,
    isDirectSupply: bsdd.isDirectSupply
  };

  const newBsdd = await create(newBsddCreateInput);

  // Final operations
  for await (const operation of bsdd.finalOperations) {
    const finalOperation: Prisma.BsddFinalOperationCreateInput = {
      initialForm: { connect: { id: newBsdd.id } },
      finalForm: { connect: { id: newBsdd.id } },
      operationCode: operation.operationCode,
      quantity: operation.quantity,
      noTraceability: operation.noTraceability
    };

    await prisma.bsddFinalOperation.create({
      data: finalOperation
    });
  }

  return newBsdd;
};
