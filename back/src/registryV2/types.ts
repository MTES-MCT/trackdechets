import type {
  IncomingWasteV2,
  OutgoingWasteV2,
  SsdWasteV2
} from "@td/codegen-back";
import { Prisma } from "@prisma/client";
export type GenericWasteV2 = SsdWasteV2 | IncomingWasteV2;

type Nullable<T> = { [K in keyof T]: T[K] | null };

// BSDD
export const RegistryV2BsddInclude = Prisma.validator<Prisma.FormInclude>()({
  forwarding: { include: { transporters: true } },
  intermediaries: true,
  forwardedIn: { include: { transporters: true } },
  finalOperations: {
    include: {
      finalForm: {
        select: {
          recipientCompanySiret: true,
          recipientProcessingOperation: true
        }
      }
    }
  },
  grouping: { include: { initialForm: { include: { transporters: true } } } },
  transporters: true
});

export type RegistryV2Bsdd = Prisma.FormGetPayload<{
  include: typeof RegistryV2BsddInclude;
}>;

// BSDA
export const RegistryV2BsdaInclude = Prisma.validator<Prisma.BsdaInclude>()({
  grouping: true,
  forwarding: true,
  intermediaries: true,
  forwardedIn: true,
  transporters: true,
  finalOperations: {
    include: {
      finalBsda: {
        select: {
          destinationCompanySiret: true,
          destinationPlannedOperationCode: true
        }
      }
    }
  }
});

export type RegistryV2Bsda = Prisma.BsdaGetPayload<{
  include: typeof RegistryV2BsdaInclude;
}>;

// BSDASRI
export const RegistryV2BsdasriInclude =
  Prisma.validator<Prisma.BsdasriInclude>()({
    grouping: true,
    finalOperations: {
      include: { finalBsdasri: { select: { destinationCompanySiret: true } } }
    }
  });

export type RegistryV2Bsdasri = Prisma.BsdasriGetPayload<{
  include: typeof RegistryV2BsdasriInclude;
}>;

// BSFF
export const RegistryV2BsffInclude = Prisma.validator<Prisma.BsffInclude>()({
  transporters: true,
  packagings: {
    include: {
      finalOperations: {
        include: {
          finalBsffPackaging: {
            include: { bsff: { select: { destinationCompanySiret: true } } }
          }
        }
      },
      previousPackagings: {
        include: { bsff: true }
      }
    }
  }
});

export type RegistryV2Bsff = Prisma.BsffGetPayload<{
  include: typeof RegistryV2BsffInclude;
}>;

// BSPAOH
export const RegistryV2BspaohInclude = Prisma.validator<Prisma.BspaohInclude>()(
  {
    transporters: true
  }
);

export type RegistryV2Bspaoh = Prisma.BspaohGetPayload<{
  include: typeof RegistryV2BspaohInclude;
}>;

// BSVHU
export const RegistryV2BsvhuInclude = Prisma.validator<Prisma.BsvhuInclude>()({
  intermediaries: true
});

export type RegistryV2Bsvhu = Prisma.BsvhuGetPayload<{
  include: typeof RegistryV2BsvhuInclude;
}>;

// Empty registy V2 exports
export const emptyIncomingWasteV2: Omit<
  Required<Nullable<IncomingWasteV2>>,
  "__typename"
> = {
  id: null,
  source: null,
  publicId: null,
  bsdId: null,
  reportAsSiret: null,
  createdAt: null,
  updatedAt: null,
  transporterTakenOverAt: null,
  destinationReceptionDate: null,
  weighingHour: null,
  destinationOperationDate: null,
  bsdType: null,
  bsdSubType: null,
  customId: null,
  status: null,
  wasteDescription: null,
  wasteCode: null,
  wasteCodeBale: null,
  wastePop: null,
  wasteIsDangerous: null,
  weight: null,
  initialEmitterCompanyName: null,
  initialEmitterCompanySiret: null,
  initialEmitterCompanyAddress: null,
  initialEmitterCompanyPostalCode: null,
  initialEmitterCompanyCity: null,
  initialEmitterCompanyCountry: null,
  initialEmitterMunicipalitiesNames: null,
  initialEmitterMunicipalitiesInseeCodes: null,
  emitterCompanyIrregularSituation: null,
  emitterCompanyName: null,
  emitterCompanyGivenName: null,
  emitterCompanySiret: null,
  emitterCompanyAddress: null,
  emitterCompanyPostalCode: null,
  emitterCompanyCity: null,
  emitterCompanyCountry: null,
  emitterPickupsiteName: null,
  emitterPickupsiteAddress: null,
  emitterPickupsitePostalCode: null,
  emitterPickupsiteCity: null,
  emitterPickupsiteCountry: null,
  emitterCompanyMail: null,
  workerCompanyName: null,
  workerCompanySiret: null,
  workerCompanyAddress: null,
  workerCompanyPostalCode: null,
  workerCompanyCity: null,
  workerCompanyCountry: null,
  parcelCities: null,
  parcelInseeCodes: null,
  parcelNumbers: null,
  parcelCoordinates: null,
  sisIdentifiers: null,
  ecoOrganismeName: null,
  ecoOrganismeSiret: null,
  traderCompanyName: null,
  traderCompanySiret: null,
  traderCompanyMail: null,
  traderRecepisseNumber: null,
  brokerCompanyName: null,
  brokerCompanySiret: null,
  brokerCompanyMail: null,
  brokerRecepisseNumber: null,
  isDirectSupply: null,
  transporter1CompanyName: null,
  transporter1CompanyGivenName: null,
  transporter1CompanySiret: null,
  transporter1CompanyAddress: null,
  transporter1CompanyPostalCode: null,
  transporter1CompanyCity: null,
  transporter1CompanyCountry: null,
  transporter1RecepisseIsExempted: null,
  transporter1RecepisseNumber: null,
  transporter1TransportMode: null,
  transporter1CompanyMail: null,
  wasteAdr: null,
  nonRoadRegulationMention: null,
  destinationCap: null,
  wasteDap: null,
  destinationCompanyName: null,
  destinationCompanyGivenName: null,
  destinationCompanySiret: null,
  destinationCompanyAddress: null,
  destinationCompanyPostalCode: null,
  destinationCompanyCity: null,
  destinationCompanyMail: null,
  destinationReceptionAcceptationStatus: null,
  destinationReceptionWeight: null,
  destinationReceptionRefusedWeight: null,
  destinationReceptionAcceptedWeight: null,
  destinationReceptionWeightIsEstimate: null,
  destinationReceptionVolume: null,
  destinationPlannedOperationCode: null,
  destinationOperationCode: null,
  destinationOperationMode: null,
  destinationHasCiterneBeenWashedOut: null,
  destinationOperationNoTraceability: null,
  declarationNumber: null,
  notificationNumber: null,
  movementNumber: null,
  nextOperationCode: null,
  isUpcycled: null,
  destinationParcelInseeCodes: null,
  destinationParcelNumbers: null,
  destinationParcelCoordinates: null,
  transporter2CompanyName: null,
  transporter2CompanyGivenName: null,
  transporter2CompanySiret: null,
  transporter2CompanyAddress: null,
  transporter2CompanyPostalCode: null,
  transporter2CompanyCity: null,
  transporter2CompanyCountry: null,
  transporter2RecepisseIsExempted: null,
  transporter2RecepisseNumber: null,
  transporter2TransportMode: null,
  transporter2CompanyMail: null,
  transporter3CompanyName: null,
  transporter3CompanyGivenName: null,
  transporter3CompanySiret: null,
  transporter3CompanyAddress: null,
  transporter3CompanyPostalCode: null,
  transporter3CompanyCity: null,
  transporter3CompanyCountry: null,
  transporter3RecepisseIsExempted: null,
  transporter3RecepisseNumber: null,
  transporter3TransportMode: null,
  transporter3CompanyMail: null,
  transporter4CompanyName: null,
  transporter4CompanyGivenName: null,
  transporter4CompanySiret: null,
  transporter4CompanyAddress: null,
  transporter4CompanyPostalCode: null,
  transporter4CompanyCity: null,
  transporter4CompanyCountry: null,
  transporter4RecepisseIsExempted: null,
  transporter4RecepisseNumber: null,
  transporter4TransportMode: null,
  transporter4CompanyMail: null,
  transporter5CompanyName: null,
  transporter5CompanyGivenName: null,
  transporter5CompanySiret: null,
  transporter5CompanyAddress: null,
  transporter5CompanyPostalCode: null,
  transporter5CompanyCity: null,
  transporter5CompanyCountry: null,
  transporter5RecepisseIsExempted: null,
  transporter5RecepisseNumber: null,
  transporter5TransportMode: null,
  transporter5CompanyMail: null
};

export const emptyOutgoingWasteV2: Omit<
  Required<Nullable<OutgoingWasteV2>>,
  "__typename"
> = {
  id: null,
  source: null,
  publicId: null,
  bsdId: null,
  reportAsSiret: null,
  createdAt: null,
  updatedAt: null,
  transporterTakenOverAt: null,
  destinationOperationDate: null,
  bsdType: null,
  bsdSubType: null,
  customId: null,
  status: null,
  wasteDescription: null,
  wasteCode: null,
  wasteCodeBale: null,
  wastePop: null,
  wasteIsDangerous: null,
  weight: null,
  weightIsEstimate: null,
  volume: null,
  initialEmitterCompanySiret: null,
  initialEmitterCompanyName: null,
  initialEmitterCompanyAddress: null,
  initialEmitterCompanyPostalCode: null,
  initialEmitterCompanyCity: null,
  initialEmitterCompanyCountry: null,
  initialEmitterMunicipalitiesInseeCodes: null,
  initialEmitterMunicipalitiesNames: null,
  emitterCompanyIrregularSituation: null,
  emitterCompanySiret: null,
  emitterCompanyName: null,
  emitterCompanyGivenName: null,
  emitterCompanyAddress: null,
  emitterCompanyPostalCode: null,
  emitterCompanyCity: null,
  emitterCompanyCountry: null,
  emitterCompanyMail: null,
  emitterPickupsiteName: null,
  emitterPickupsiteAddress: null,
  emitterPickupsitePostalCode: null,
  emitterPickupsiteCity: null,
  emitterPickupsiteCountry: null,
  workerCompanySiret: null,
  workerCompanyName: null,
  workerCompanyAddress: null,
  workerCompanyPostalCode: null,
  workerCompanyCity: null,
  workerCompanyCountry: null,
  parcelCities: null,
  parcelInseeCodes: null,
  parcelNumbers: null,
  parcelCoordinates: null,
  sisIdentifiers: null,
  ecoOrganismeSiret: null,
  ecoOrganismeName: null,
  brokerCompanySiret: null,
  brokerCompanyName: null,
  brokerRecepisseNumber: null,
  brokerCompanyMail: null,
  traderCompanySiret: null,
  traderCompanyName: null,
  traderRecepisseNumber: null,
  traderCompanyMail: null,
  isDirectSupply: null,
  transporter1CompanySiret: null,
  transporter1CompanyName: null,
  transporter1CompanyGivenName: null,
  transporter1CompanyAddress: null,
  transporter1CompanyPostalCode: null,
  transporter1CompanyCity: null,
  transporter1CompanyCountry: null,
  transporter1RecepisseIsExempted: null,
  transporter1RecepisseNumber: null,
  transporter1TransportMode: null,
  transporter1CompanyMail: null,
  transporter2CompanyName: null,
  transporter2CompanyGivenName: null,
  transporter2CompanySiret: null,
  transporter2CompanyAddress: null,
  transporter2CompanyPostalCode: null,
  transporter2CompanyCity: null,
  transporter2CompanyCountry: null,
  transporter2RecepisseIsExempted: null,
  transporter2RecepisseNumber: null,
  transporter2TransportMode: null,
  transporter2CompanyMail: null,
  transporter3CompanyName: null,
  transporter3CompanyGivenName: null,
  transporter3CompanySiret: null,
  transporter3CompanyAddress: null,
  transporter3CompanyPostalCode: null,
  transporter3CompanyCity: null,
  transporter3CompanyCountry: null,
  transporter3RecepisseIsExempted: null,
  transporter3RecepisseNumber: null,
  transporter3TransportMode: null,
  transporter3CompanyMail: null,
  transporter4CompanyName: null,
  transporter4CompanyGivenName: null,
  transporter4CompanySiret: null,
  transporter4CompanyAddress: null,
  transporter4CompanyPostalCode: null,
  transporter4CompanyCity: null,
  transporter4CompanyCountry: null,
  transporter4RecepisseIsExempted: null,
  transporter4RecepisseNumber: null,
  transporter4TransportMode: null,
  transporter4CompanyMail: null,
  transporter5CompanyName: null,
  transporter5CompanyGivenName: null,
  transporter5CompanySiret: null,
  transporter5CompanyAddress: null,
  transporter5CompanyPostalCode: null,
  transporter5CompanyCity: null,
  transporter5CompanyCountry: null,
  transporter5RecepisseIsExempted: null,
  transporter5RecepisseNumber: null,
  transporter5TransportMode: null,
  transporter5CompanyMail: null,
  wasteAdr: null,
  nonRoadRegulationMention: null,
  destinationCap: null,
  wasteDap: null,
  destinationCompanySiret: null,
  destinationCompanyName: null,
  destinationCompanyGivenName: null,
  destinationCompanyAddress: null,
  destinationCompanyPostalCode: null,
  destinationCompanyCity: null,
  destinationCompanyCountry: null,
  destinationCompanyMail: null,
  destinationDropSiteAddress: null,
  destinationDropSitePostalCode: null,
  destinationDropSiteCity: null,
  destinationDropSiteCountryCode: null,
  postTempStorageDestinationSiret: null,
  postTempStorageDestinationName: null,
  postTempStorageDestinationAddress: null,
  postTempStorageDestinationPostalCode: null,
  postTempStorageDestinationCity: null,
  postTempStorageDestinationCountry: null,
  destinationReceptionAcceptationStatus: null,
  destinationReceptionWeight: null,
  destinationReceptionAcceptedWeight: null,
  destinationReceptionRefusedWeight: null,
  destinationPlannedOperationCode: null,
  destinationPlannedOperationMode: null,
  destinationOperationCode: null,
  destinationOperationMode: null,
  destinationHasCiterneBeenWashedOut: null,
  destinationOperationNoTraceability: null,
  destinationFinalOperationCompanySirets: null,
  destinationFinalPlannedOperationCodes: null,
  destinationFinalOperationCodes: null,
  destinationFinalOperationWeights: null,
  declarationNumber: null,
  movementNumber: null,
  notificationNumber: null,
  isUpcycled: null,
  destinationParcelInseeCodes: null,
  destinationParcelNumbers: null,
  destinationParcelCoordinates: null
};
