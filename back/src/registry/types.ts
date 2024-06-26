import {
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste,
  PageInfo,
  QueryIncomingWastesArgs,
  QueryManagedWastesArgs,
  QueryOutgoingWastesArgs,
  QueryTransportedWastesArgs,
  AllWaste
} from "../generated/graphql/types";
import { estypes } from "@elastic/elasticsearch";

export type RegistryFields =
  | "isIncomingWasteFor"
  | "isOutgoingWasteFor"
  | "isTransportedWasteFor"
  | "isManagedWasteFor"
  | "isAllWasteFor";

export type GenericWaste =
  | IncomingWaste
  | OutgoingWaste
  | TransportedWaste
  | ManagedWaste
  | AllWaste;

export type PaginationArgs = {
  first: number;
  after: string;
  last: number;
  before: string;
};

export type QueryWastesArgs =
  | QueryIncomingWastesArgs
  | QueryOutgoingWastesArgs
  | QueryManagedWastesArgs
  | QueryTransportedWastesArgs;

export type WasteEdge<WasteType extends GenericWaste> = {
  cursor: string;
  node: WasteType;
};

export type WasteConnection<WasteType extends GenericWaste> = {
  totalCount: estypes.integer;
  pageInfo: PageInfo;
  edges: WasteEdge<WasteType>[];
};

export const emptyIncomingWaste: Required<IncomingWaste> = {
  __typename: "IncomingWaste",
  destinationReceptionDate: null,
  wasteDescription: null,
  wasteCode: null,
  pop: null,
  id: null,
  destinationReceptionWeight: null,
  initialEmitterCompanyName: null,
  initialEmitterCompanySiret: null,
  initialEmitterCompanyAddress: null,
  initialEmitterPostalCodes: null,
  emitterCompanyName: null,
  emitterCompanySiret: null,
  emitterCompanyAddress: null,
  emitterPickupsiteName: null,
  emitterPickupsiteAddress: null,
  ecoOrganismeName: null,
  ecoOrganismeSiren: null,
  traderCompanyName: null,
  traderCompanySiret: null,
  traderRecepisseNumber: null,
  brokerCompanyName: null,
  brokerCompanySiret: null,
  brokerRecepisseNumber: null,
  transporterCompanyName: null,
  transporterCompanySiret: null,
  transporterCompanyAddress: null,
  transporterRecepisseNumber: null,
  transporterTransportMode: null,
  transporter2CompanyName: null,
  transporter2CompanySiret: null,
  transporter2CompanyAddress: null,
  transporter2RecepisseNumber: null,
  transporter2TransportMode: null,
  transporter3CompanyName: null,
  transporter3CompanySiret: null,
  transporter3CompanyAddress: null,
  transporter3RecepisseNumber: null,
  transporter3TransportMode: null,
  transporter4CompanyName: null,
  transporter4CompanySiret: null,
  transporter4CompanyAddress: null,
  transporter4RecepisseNumber: null,
  transporter4TransportMode: null,
  transporter5CompanyName: null,
  transporter5CompanySiret: null,
  transporter5CompanyAddress: null,
  transporter5RecepisseNumber: null,
  transporter5TransportMode: null,
  destinationCompanyName: null,
  destinationCompanySiret: null,
  destinationCompanyAddress: null,
  destinationPlannedOperationCode: null,
  destinationOperationCode: null,
  destinationOperationMode: null,
  createdAt: null,
  updatedAt: null,
  bsdType: null,
  bsdSubType: null,
  status: null,
  customId: null,
  destinationCustomInfo: null,
  destinationCap: null,
  destinationOperationNoTraceability: null,
  destinationReceptionAcceptationStatus: null,
  destinationOperationDate: null,
  emitterCompanyMail: null,
  transporterCompanyMail: null,
  transporter2CompanyMail: null,
  transporter3CompanyMail: null,
  transporter4CompanyMail: null,
  transporter5CompanyMail: null,
  transporterRecepisseIsExempted: null,
  transporter2RecepisseIsExempted: null,
  transporter3RecepisseIsExempted: null,
  transporter4RecepisseIsExempted: null,
  transporter5RecepisseIsExempted: null,
  wasteAdr: null,
  wasteIsDangerous: null,
  workerCompanyName: null,
  workerCompanySiret: null,
  workerCompanyAddress: null,
  nextDestinationNotificationNumber: null,
  nextDestinationProcessingOperation: null,
  brokerCompanyMail: null,
  destinationCompanyMail: null,
  traderCompanyMail: null,
  parcelCities: null,
  parcelPostalCodes: null,
  parcelNumbers: null,
  parcelCoordinates: null
};

export const emptyOutgoingWaste: Required<OutgoingWaste> = {
  __typename: "OutgoingWaste",
  transporterTakenOverAt: null,
  wasteDescription: null,
  wasteCode: null,
  pop: null,
  id: null,
  weight: null,
  emitterCompanyName: null,
  emitterCompanySiret: null,
  emitterCompanyAddress: null,
  emitterPickupsiteName: null,
  emitterPickupsiteAddress: null,
  initialEmitterCompanyName: null,
  initialEmitterCompanySiret: null,
  initialEmitterCompanyAddress: null,
  initialEmitterPostalCodes: null,
  ecoOrganismeName: null,
  ecoOrganismeSiren: null,
  traderCompanyName: null,
  traderCompanySiret: null,
  traderRecepisseNumber: null,
  brokerCompanyName: null,
  brokerCompanySiret: null,
  brokerRecepisseNumber: null,
  transporterCompanyName: null,
  transporterCompanySiret: null,
  transporterCompanyAddress: null,
  transporterRecepisseNumber: null,
  transporterTransportMode: null,
  transporter2CompanyName: null,
  transporter2CompanySiret: null,
  transporter2CompanyAddress: null,
  transporter2RecepisseNumber: null,
  transporter2TransportMode: null,
  transporter3CompanyName: null,
  transporter3CompanySiret: null,
  transporter3CompanyAddress: null,
  transporter3RecepisseNumber: null,
  transporter3TransportMode: null,
  transporter4CompanyName: null,
  transporter4CompanySiret: null,
  transporter4CompanyAddress: null,
  transporter4RecepisseNumber: null,
  transporter4TransportMode: null,
  transporter5CompanyName: null,
  transporter5CompanySiret: null,
  transporter5CompanyAddress: null,
  transporter5RecepisseNumber: null,
  transporter5TransportMode: null,
  destinationCompanyName: null,
  destinationCompanySiret: null,
  destinationCompanyAddress: null,
  destinationOperationCode: null,
  destinationOperationMode: null,
  destinationPlannedOperationCode: null,
  destinationPlannedOperationMode: null,
  destinationReceptionWeight: null,
  createdAt: null,
  updatedAt: null,
  bsdType: null,
  bsdSubType: null,
  status: null,
  customId: null,
  emitterCustomInfo: null,
  destinationCap: null,
  destinationOperationNoTraceability: null,
  destinationReceptionAcceptationStatus: null,
  destinationOperationDate: null,
  transporterCompanyMail: null,
  transporter2CompanyMail: null,
  transporter3CompanyMail: null,
  transporter4CompanyMail: null,
  transporter5CompanyMail: null,
  transporterRecepisseIsExempted: null,
  transporter2RecepisseIsExempted: null,
  transporter3RecepisseIsExempted: null,
  transporter4RecepisseIsExempted: null,
  transporter5RecepisseIsExempted: null,
  destinationCompanyMail: null,
  wasteAdr: null,
  wasteIsDangerous: null,
  workerCompanyName: null,
  workerCompanySiret: null,
  workerCompanyAddress: null,
  destinationFinalOperationCodes: [],
  destinationFinalOperationWeights: [],
  nextDestinationNotificationNumber: null,
  nextDestinationProcessingOperation: null,
  postTempStorageDestinationAddress: null,
  postTempStorageDestinationCity: null,
  postTempStorageDestinationName: null,
  postTempStorageDestinationPostalCode: null,
  postTempStorageDestinationSiret: null,
  postTempStorageDestinationCountry: null,
  brokerCompanyMail: null,
  traderCompanyMail: null,
  parcelCities: null,
  parcelPostalCodes: null,
  parcelNumbers: null,
  parcelCoordinates: null
};

export const emptyTransportedWaste: Required<TransportedWaste> = {
  __typename: "TransportedWaste",
  transporterTakenOverAt: null,
  destinationReceptionDate: null,
  wasteDescription: null,
  wasteCode: null,
  pop: null,
  id: null,
  weight: null,
  transporterCompanyName: null,
  transporterCompanySiret: null,
  transporterCompanyAddress: null,
  transporterNumberPlates: null,
  transporterRecepisseNumber: null,
  transporterTransportMode: null,
  transporterHandedOverSignatureDate: null,
  transporter2CompanyName: null,
  transporter2CompanySiret: null,
  transporter2CompanyAddress: null,
  transporter2NumberPlates: null,
  transporter2RecepisseNumber: null,
  transporter2TransportMode: null,
  transporter2HandedOverSignatureDate: null,
  transporter3CompanyName: null,
  transporter3CompanySiret: null,
  transporter3CompanyAddress: null,
  transporter3NumberPlates: null,
  transporter3RecepisseNumber: null,
  transporter3TransportMode: null,
  transporter3HandedOverSignatureDate: null,
  transporter4CompanyName: null,
  transporter4CompanySiret: null,
  transporter4CompanyAddress: null,
  transporter4NumberPlates: null,
  transporter4RecepisseNumber: null,
  transporter4TransportMode: null,
  transporter4HandedOverSignatureDate: null,
  transporter5CompanyName: null,
  transporter5CompanySiret: null,
  transporter5CompanyAddress: null,
  transporter5NumberPlates: null,
  transporter5RecepisseNumber: null,
  transporter5TransportMode: null,
  transporter5HandedOverSignatureDate: null,
  wasteAdr: null,
  initialEmitterCompanyName: null,
  initialEmitterCompanySiret: null,
  initialEmitterCompanyAddress: null,
  initialEmitterPostalCodes: null,
  emitterCompanyName: null,
  emitterCompanySiret: null,
  emitterCompanyAddress: null,
  emitterPickupsiteName: null,
  emitterPickupsiteAddress: null,
  ecoOrganismeName: null,
  ecoOrganismeSiren: null,
  traderCompanyName: null,
  traderCompanySiret: null,
  traderRecepisseNumber: null,
  brokerCompanyName: null,
  brokerCompanySiret: null,
  brokerRecepisseNumber: null,
  destinationCompanyName: null,
  destinationCompanySiret: null,
  destinationCompanyAddress: null,
  destinationReceptionWeight: null,
  createdAt: null,
  updatedAt: null,
  bsdType: null,
  bsdSubType: null,
  status: null,
  customId: null,
  transporterCustomInfo: null,
  transporterCompanyMail: null,
  transporter2CompanyMail: null,
  transporter3CompanyMail: null,
  transporter4CompanyMail: null,
  transporter5CompanyMail: null,
  transporterRecepisseIsExempted: null,
  transporter2RecepisseIsExempted: null,
  transporter3RecepisseIsExempted: null,
  transporter4RecepisseIsExempted: null,
  transporter5RecepisseIsExempted: null,
  destinationCap: null,
  destinationOperationNoTraceability: null,
  destinationReceptionAcceptationStatus: null,
  destinationOperationDate: null,
  emitterCompanyMail: null,
  destinationCompanyMail: null,
  workerCompanyName: null,
  workerCompanySiret: null,
  workerCompanyAddress: null,
  wasteIsDangerous: null,
  brokerCompanyMail: null,
  traderCompanyMail: null
};

export const emptyManagedWaste: Required<ManagedWaste> = {
  __typename: "ManagedWaste",
  id: null,
  traderCompanyName: null,
  traderCompanySiret: null,
  brokerCompanyName: null,
  brokerCompanySiret: null,
  managedStartDate: null,
  managedEndDate: null,
  wasteDescription: null,
  wasteCode: null,
  pop: null,
  destinationReceptionWeight: null,
  ecoOrganismeName: null,
  ecoOrganismeSiren: null,
  initialEmitterCompanyName: null,
  initialEmitterCompanySiret: null,
  initialEmitterCompanyAddress: null,
  initialEmitterPostalCodes: null,
  emitterCompanyName: null,
  emitterCompanySiret: null,
  emitterCompanyAddress: null,
  emitterPickupsiteName: null,
  emitterPickupsiteAddress: null,
  transporterCompanyName: null,
  transporterCompanySiret: null,
  transporterCompanyAddress: null,
  transporterRecepisseNumber: null,
  transporterTransportMode: null,
  transporter2CompanyName: null,
  transporter2CompanySiret: null,
  transporter2CompanyAddress: null,
  transporter2RecepisseNumber: null,
  transporter2TransportMode: null,
  transporter3CompanyName: null,
  transporter3CompanySiret: null,
  transporter3CompanyAddress: null,
  transporter3RecepisseNumber: null,
  transporter3TransportMode: null,
  transporter4CompanyName: null,
  transporter4CompanySiret: null,
  transporter4CompanyAddress: null,
  transporter4RecepisseNumber: null,
  transporter4TransportMode: null,
  transporter5CompanyName: null,
  transporter5CompanySiret: null,
  transporter5CompanyAddress: null,
  transporter5RecepisseNumber: null,
  transporter5TransportMode: null,
  destinationCompanyName: null,
  destinationCompanySiret: null,
  destinationCompanyAddress: null,
  destinationPlannedOperationCode: null,
  destinationPlannedOperationMode: null,
  createdAt: null,
  updatedAt: null,
  bsdType: null,
  bsdSubType: null,
  status: null,
  customId: null,
  destinationCap: null,
  destinationOperationNoTraceability: null,
  destinationReceptionAcceptationStatus: null,
  destinationOperationDate: null,
  emitterCompanyMail: null,
  transporterCompanyMail: null,
  transporter2CompanyMail: null,
  transporter3CompanyMail: null,
  transporter4CompanyMail: null,
  transporter5CompanyMail: null,
  transporterRecepisseIsExempted: null,
  transporter2RecepisseIsExempted: null,
  transporter3RecepisseIsExempted: null,
  transporter4RecepisseIsExempted: null,
  transporter5RecepisseIsExempted: null,
  destinationCompanyMail: null,
  wasteAdr: null,
  wasteIsDangerous: null,
  workerCompanyName: null,
  workerCompanySiret: null,
  workerCompanyAddress: null,
  nextDestinationNotificationNumber: null,
  nextDestinationProcessingOperation: null,
  parcelCities: null,
  parcelPostalCodes: null,
  parcelNumbers: null,
  parcelCoordinates: null,
  // En attente des correctifs recette sur TRA-12745
  // finalOperationCodes: null,
  // finalReceptionWeights: null
  brokerCompanyMail: null,
  traderCompanyMail: null
};

export const emptyAllWaste: Required<AllWaste> = {
  __typename: "AllWaste",
  id: null,
  transporterTakenOverAt: null,
  destinationReceptionDate: null,
  managedStartDate: null,
  managedEndDate: null,
  wasteDescription: null,
  wasteCode: null,
  pop: null,
  ecoOrganismeName: null,
  ecoOrganismeSiren: null,
  initialEmitterCompanyName: null,
  initialEmitterCompanySiret: null,
  initialEmitterCompanyAddress: null,
  initialEmitterPostalCodes: null,
  emitterCompanyName: null,
  emitterCompanySiret: null,
  emitterCompanyAddress: null,
  emitterPickupsiteName: null,
  emitterPickupsiteAddress: null,
  weight: null,
  transporterCompanyName: null,
  transporterCompanySiret: null,
  transporterCompanyAddress: null,
  transporterNumberPlates: null,
  transporterRecepisseNumber: null,
  transporterTransportMode: null,
  transporterHandedOverSignatureDate: null,
  transporter2CompanyName: null,
  transporter2CompanySiret: null,
  transporter2CompanyAddress: null,
  transporter2NumberPlates: null,
  transporter2RecepisseNumber: null,
  transporter2TransportMode: null,
  transporter2HandedOverSignatureDate: null,
  transporter3CompanyName: null,
  transporter3CompanySiret: null,
  transporter3CompanyAddress: null,
  transporter3NumberPlates: null,
  transporter3RecepisseNumber: null,
  transporter3TransportMode: null,
  transporter3HandedOverSignatureDate: null,
  transporter4CompanyName: null,
  transporter4CompanySiret: null,
  transporter4CompanyAddress: null,
  transporter4NumberPlates: null,
  transporter4RecepisseNumber: null,
  transporter4TransportMode: null,
  transporter4HandedOverSignatureDate: null,
  transporter5CompanyName: null,
  transporter5CompanySiret: null,
  transporter5CompanyAddress: null,
  transporter5NumberPlates: null,
  transporter5RecepisseNumber: null,
  transporter5TransportMode: null,
  transporter5HandedOverSignatureDate: null,
  wasteAdr: null,
  wasteIsDangerous: null,
  traderCompanyName: null,
  traderCompanySiret: null,
  traderRecepisseNumber: null,
  brokerCompanyName: null,
  brokerCompanySiret: null,
  brokerRecepisseNumber: null,
  destinationReceptionWeight: null,
  destinationCompanyName: null,
  destinationCompanySiret: null,
  destinationCompanyAddress: null,
  destinationOperationCode: null,
  destinationOperationMode: null,
  destinationPlannedOperationCode: null,
  destinationPlannedOperationMode: null,
  destinationOperationDate: null,
  createdAt: null,
  updatedAt: null,
  bsdType: null,
  bsdSubType: null,
  status: null,
  customId: null,
  destinationCap: null,
  destinationOperationNoTraceability: null,
  destinationReceptionAcceptationStatus: null,
  emitterCompanyMail: null,
  transporterCompanyMail: null,
  transporter2CompanyMail: null,
  transporter3CompanyMail: null,
  transporter4CompanyMail: null,
  transporter5CompanyMail: null,
  transporterRecepisseIsExempted: null,
  transporter2RecepisseIsExempted: null,
  transporter3RecepisseIsExempted: null,
  transporter4RecepisseIsExempted: null,
  transporter5RecepisseIsExempted: null,
  destinationCompanyMail: null,
  workerCompanyName: null,
  workerCompanySiret: null,
  workerCompanyAddress: null,
  destinationFinalOperationCodes: [],
  destinationFinalOperationWeights: [],
  nextDestinationNotificationNumber: null,
  nextDestinationProcessingOperation: null,
  intermediary1CompanyName: null,
  intermediary1CompanySiret: null,
  intermediary2CompanyName: null,
  intermediary2CompanySiret: null,
  intermediary3CompanyName: null,
  intermediary3CompanySiret: null,
  postTempStorageDestinationAddress: null,
  postTempStorageDestinationCity: null,
  postTempStorageDestinationName: null,
  postTempStorageDestinationPostalCode: null,
  postTempStorageDestinationSiret: null,
  postTempStorageDestinationCountry: null,
  brokerCompanyMail: null,
  traderCompanyMail: null,
  parcelCities: null,
  parcelPostalCodes: null,
  parcelNumbers: null,
  parcelCoordinates: null
};
