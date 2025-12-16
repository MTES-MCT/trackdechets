import {
  Bsda,
  BsdaDestination,
  BsdaEcoOrganisme,
  BsdaEmitter,
  BsdaMetadata,
  Bsdasri,
  BsdasriDestination,
  BsdasriEcoOrganisme,
  BsdasriEmitter,
  BsdasriStatus,
  BsdasriTransporter,
  BsdasriType,
  BsdaStatus,
  BsdaTransporter,
  BsdaType,
  BsdaWorker,
  BsdType,
  BsffDestination,
  BsffEmitter,
  BsffPackaging,
  BsffStatus,
  BsffTransporter,
  BsffType,
  BsvhuDestination,
  BsvhuEmitter,
  BsvhuStatus,
  BsvhuTransporter,
  Emitter,
  EmitterType,
  FormEcoOrganisme,
  FormMetadata,
  FormStatus,
  InitialBsda,
  InitialBsdasri,
  InitialFormFraction,
  BspaohTransporter,
  BspaohDestination,
  Maybe,
  Recipient,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus,
  Scalars,
  TemporaryStorageDetail,
  Transporter,
  TransportMode,
  BsdasriMetadata,
  Broker,
  Trader,
  BsdaBroker,
  FormCompany,
  BsvhuEcoOrganisme
} from "@td/codegen-ui";

export enum BsdTypename {
  Bsdd = "Form",
  Bsda = "Bsda",
  Bsdasri = "Bsdasri",
  Bsvhu = "Bsvhu",
  Bsff = "Bsff",
  Bspaoh = "Bspaoh"
}

export const BsdStatusCode = {
  ...FormStatus,
  ...BsdaStatus,
  ...BsffStatus,
  ...BsdasriStatus,
  ...BsvhuStatus,
  ...RevisionRequestStatus,
  ...RevisionRequestApprovalStatus
};

export enum ReviewStatusLabel {
  Pending = "En attente de révision",
  Accepted = "Révision approuvée",
  Refused = "Révision refusée",
  Cancelled = "Révision annulée"
}

type TBsdStatusCodeKeys = keyof typeof BsdStatusCode;
export type TBsdStatusCode = (typeof BsdStatusCode)[TBsdStatusCodeKeys];
export interface BsdDisplay {
  id: string;
  readableid: string;
  customId?: string;
  type: BsdType;
  isDraft: boolean;
  status: TBsdStatusCode;
  wasteDetails: {
    code?: Maybe<string>;
    name?: Maybe<string>;
    weight?: Maybe<number>;
  };
  isTempStorage?: Maybe<boolean>;
  emitter?: Maybe<Emitter> &
    Maybe<BsdaEmitter> &
    Maybe<BsdasriEmitter> &
    Maybe<BsvhuEmitter> &
    Maybe<BsffEmitter> &
    Maybe<BspaohTransporter>;
  emitterType?: Maybe<EmitterType>;
  destination?:
    | Maybe<Recipient>
    | Maybe<BsdasriDestination>
    | Maybe<BsdaDestination>
    | Maybe<BsvhuDestination>
    | Maybe<BsffDestination>
    | Maybe<BspaohDestination>;
  transporter?:
    | Maybe<Transporter>
    | Maybe<BsdaTransporter>
    | Maybe<BsdasriTransporter>
    | Maybe<BsvhuTransporter>
    | Maybe<BsffTransporter>
    | Maybe<BspaohTransporter>;
  transporters?:
    | Transporter[]
    | BsdaTransporter[]
    | BsffTransporter[]
    | BsvhuTransporter[];
  ecoOrganisme?:
    | Maybe<FormEcoOrganisme>
    | Maybe<BsdaEcoOrganisme>
    | Maybe<BsdasriEcoOrganisme>
    | Maybe<BsvhuEcoOrganisme>;
  updatedAt?: Maybe<string> | Maybe<Scalars["DateTime"]>;
  emittedByEcoOrganisme?: Maybe<boolean> | Maybe<BsdaEcoOrganisme>;
  worker?: Maybe<BsdaWorker>;
  trader?: Maybe<Trader>;
  broker?: Maybe<Broker> | Maybe<BsdaBroker>;
  intermediaries?: FormCompany[];
  bsdWorkflowType?:
    | Maybe<BsdaType>
    | BsdasriType
    | BsffType
    | Maybe<EmitterType>;
  grouping?:
    | Maybe<Array<InitialFormFraction>>
    | Maybe<Array<InitialBsdasri>>
    | Array<BsffPackaging>
    | Maybe<Array<InitialBsda>>;
  groupedIn?: Maybe<Bsda> | Maybe<Bsdasri>;
  forwardedIn?: Maybe<Bsda>;
  synthesizing?: Maybe<Array<InitialBsdasri>>;
  temporaryStorageDetail?: Maybe<TemporaryStorageDetail>;
  allowDirectTakeOver?: Maybe<Scalars["Boolean"]>;
  transporterCustomInfo?: string | Maybe<string[]>;
  transporterNumberPlate?: string | Maybe<string[]>;
  packagings?: Array<BsffPackaging>;
  synthesizedIn?: Maybe<Bsdasri>;
  metadata?: FormMetadata | BsdaMetadata | BsdasriMetadata;
}

export enum WorkflowDisplayType {
  GRP = "Groupement",
  REGROUPEMENT = "Regroupement",
  SYNTH = "Synth",
  TOURNEE = "Tournée dédiée",
  ANNEXE_1 = "Annexe 1",
  ANNEXE_2 = "Annexe 2",
  RECONDITIONNEMENT = "Reconditionnement",
  REEXPEDITION = "Réexpédition",
  Collection_2710 = "Collecte en déchèterie",
  Initial = "Initial",
  DEFAULT = ""
}

export type BsdCurrentTransporterInfos = {
  transporterId?: string;
  transporterCustomInfo?: string | Maybe<string[]>;
  transporterNumberPlate?: string | Maybe<string[]>;
  transporterMode?: TransportMode;
};
