import {
  Form,
  TemporaryStorageDetail,
  TransportSegment,
  Prisma,
  TransportMode,
  WasteAcceptationStatus
} from "@prisma/client";
import { FormStatus } from "../generated/graphql/types";

/**
 * A Prisma Form with linked objects
 */
export interface FullForm extends Form {
  temporaryStorageDetail: TemporaryStorageDetail;
  transportSegments: TransportSegment[];
}

export type FormSirets = Pick<
  Form,
  | "emitterCompanySiret"
  | "recipientCompanySiret"
  | "transporterCompanySiret"
  | "traderCompanySiret"
  | "brokerCompanySiret"
  | "ecoOrganismeSiret"
> & {
  temporaryStorageDetail?: Pick<
    TemporaryStorageDetail,
    "transporterCompanySiret" | "destinationCompanySiret"
  >;
} & {
  transportSegments?: Pick<TransportSegment, "transporterCompanySiret">[];
};

// shape of a BSDD v2
export type Bsdd = {
  id: string;
  customId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  isDraft: boolean;
  status: FormStatus;
  pop: boolean | null;
  ecoOrganismeName: string | null;
  ecoOrganismeSiret: string | null;
  emitterCompanyName: string | null;
  emitterCompanySiret: string | null;
  emitterCompanyAddress: string | null;
  emitterCompanyContact: string | null;
  emitterCompanyPhone: string | null;
  emitterCompanyMail: string | null;
  emitterCustomInfo: string | null;
  emitterPickupSiteName: string | null;
  emitterPickupSiteAddress: string | null;
  emitterPickupSiteCity: string | null;
  emitterPickupSitePostalCode: string | null;
  emitterPickupSiteInfos: string | null;
  emitterEmissionSignatureAuthor: string | null;
  emitterEmissionSignatureDate: Date | null;
  packagings: Prisma.JsonValue;
  wasteCode: string | null;
  wasteDescription: string | null;
  wasteAdr: string | null;
  weightValue: number | null;
  weightIsEstimate: boolean | null;
  transporterCompanyName: string | null;
  transporterCompanySiret: string | null;
  transporterCompanyVatNumber: string | null;
  transporterCompanyAddress: string | null;
  transporterCompanyContact: string | null;
  transporterCompanyPhone: string | null;
  transporterCompanyMail: string | null;
  transporterCustomInfo: string | null;
  transporterRecepisseIsExempted: boolean | null;
  transporterRecepisseNumber: string | null;
  transporterRecepisseDepartment: string | null;
  transporterRecepisseValidityLimit: Date | null;
  transporterTransportMode: TransportMode | null;
  transporterNumberPlates: string[] | null;
  transporterTransportTakenOverAt: Date | null;
  transporterTransportSignatureAuthor: string | null;
  transporterTransportSignatureDate: Date | null;
  traderCompanyName: string | null;
  traderCompanySiret: string | null;
  traderCompanyAddress: string | null;
  traderCompanyContact: string | null;
  traderCompanyPhone: string | null;
  traderCompanyMail: string | null;
  traderRecepisseNumber: string | null;
  traderRecepisseDepartment: string | null;
  traderRecepisseValidityLimit: Date | null;
  brokerCompanyName: string | null;
  brokerCompanySiret: string | null;
  brokerCompanyAddress: string | null;
  brokerCompanyContact: string | null;
  brokerCompanyPhone: string | null;
  brokerCompanyMail: string | null;
  brokerRecepisseNumber: string | null;
  brokerRecepisseDepartment: string | null;
  brokerRecepisseValidityLimit: Date | null;
  destinationCompanyName: string | null;
  destinationCompanySiret: string | null;
  destinationCompanyAddress: string | null;
  destinationCompanyContact: string | null;
  destinationCompanyPhone: string | null;
  destinationCompanyMail: string | null;
  destinationCustomInfo: string | null;
  destinationReceptionDate: Date | null;
  destinationReceptionWeight: number | null;
  destinationReceptionAcceptationStatus: WasteAcceptationStatus | null;
  destinationReceptionRefusalReason: string | null;
  destinationReceptionSignatureAuthor: string | null;
  destinationReceptionSignatureDate: Date | null;
  destinationPlannedOperationCode: string | null;
  destinationOperationCode: string | null;
  destinationOperationNoTraceability: boolean | null;
  destinationOperationNextDestinationCompanyName: string | null;
  destinationOperationNextDestinationCompanySiret: string | null;
  destinationOperationNextDestinationCompanyVatNumber: string | null;
  destinationOperationNextDestinationCompanyAddress: string | null;
  destinationOperationNextDestinationCompanyContact: string | null;
  destinationOperationNextDestinationCompanyPhone: string | null;
  destinationOperationNextDestinationCompanyMail: string | null;
  destinationOperationSignatureAuthor: string | null;
  destinationOperationDate: Date | null;
  destinationOperationSignatureDate: Date | null;
  destinationCap: string | null;
};
