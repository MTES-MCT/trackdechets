import {
  BsdaDestination,
  BsdaEcoOrganisme,
  BsdaEmitter,
  BsdasriDestination,
  BsdasriEcoOrganisme,
  BsdasriEmitter,
  BsdasriTransporter,
  BsdasriType,
  BsdaTransporter,
  BsdaType,
  BsdaWeight,
  BsdaWorker,
  BsdType,
  BsffDestination,
  BsffEmitter,
  BsffPackaging,
  BsffTransporter,
  BsffType,
  BsffWeight,
  BsvhuDestination,
  BsvhuEmitter,
  BsvhuTransporter,
  BsvhuWeight,
  Emitter,
  FormEcoOrganisme,
  InitialBsda,
  InitialBsdasri,
  InitialFormFraction,
  Maybe,
  Recipient,
  Scalars,
  TemporaryStorageDetail,
  Transporter,
} from "generated/graphql/types";

export enum BsdTypename {
  Bsdd = "Form",
  Bsda = "Bsda",
  Bsdasri = "Bsdasri",
  Bsvhu = "Bsvhu",
  Bsff = "Bsff",
}

export enum BsdStatusCode { // TODO a revoir avec harmonisation des status
  DRAFT = "DRAFT",
  SEALED = "SEALED",
  SENT = "SENT",
  RECEIVED = "RECEIVED",
  ACCEPTED = "ACCEPTED",
  PROCESSED = "PROCESSED",
  AWAITING_GROUP = "AWAITING_GROUP",
  GROUPED = "GROUPED",
  NO_TRACEABILITY = "NO_TRACEABILITY",
  REFUSED = "REFUSED",
  TEMP_STORED = "TEMP_STORED",
  TEMP_STORER_ACCEPTED = "TEMP_STORER_ACCEPTED",
  RESEALED = "RESEALED",
  RESENT = "RESENT",
  SIGNED_BY_PRODUCER = "SIGNED_BY_PRODUCER",
  INITIAL = "INITIAL",
  SIGNED_BY_EMITTER = "SIGNED_BY_EMITTER",
  INTERMEDIATELY_PROCESSED = "INTERMEDIATELY_PROCESSED",
  PARTIALLY_REFUSED = "PARTIALLY_REFUSED",
  FOLLOWED_WITH_PNTTD = "FOLLOWED_WITH_PNTTD",
  SIGNED_BY_TEMP_STORER = "SIGNED_BY_TEMP_STORER",
  SIGNED_BY_WORKER = "SIGNED_BY_WORKER",
  AWAITING_CHILD = "AWAITING_CHILD",
}

export interface BsdDisplay {
  id: string;
  type: BsdType;
  isDraft: boolean;
  status: BsdStatusCode;
  wasteDetails: {
    code?: Maybe<string>;
    name?: Maybe<string>;
    weight?:
      | Maybe<number>
      | Maybe<BsdaWeight>
      | Maybe<BsvhuWeight>
      | Maybe<BsffWeight>;
  };
  isTempStorage?: Maybe<boolean>;
  emitter?:
    | Maybe<Emitter>
    | Maybe<BsdaEmitter>
    | Maybe<BsdasriEmitter>
    | Maybe<BsvhuEmitter>
    | Maybe<BsffEmitter>;
  destination?:
    | Maybe<Recipient>
    | Maybe<BsdasriDestination>
    | Maybe<BsdaDestination>
    | Maybe<BsvhuDestination>
    | Maybe<BsffDestination>;
  transporter?:
    | Maybe<Transporter>
    | Maybe<BsdaTransporter>
    | Maybe<BsdasriTransporter>
    | Maybe<BsvhuTransporter>
    | Maybe<BsffTransporter>;
  ecoOrganisme?:
    | Maybe<FormEcoOrganisme>
    | Maybe<BsdaEcoOrganisme>
    | Maybe<BsdasriEcoOrganisme>;
  updatedAt?: Maybe<string> | Maybe<Scalars["DateTime"]>;
  emittedByEcoOrganisme?: Maybe<boolean> | Maybe<BsdaEcoOrganisme>;
  worker?: Maybe<BsdaWorker> | undefined;
  bsdWorkflowType?: Maybe<BsdaType> | BsdasriType | BsffType;
  grouping?:
    | Maybe<Array<InitialFormFraction>>
    | Maybe<Array<InitialBsdasri>>
    | Array<BsffPackaging>
    | Maybe<Array<InitialBsda>>;
  synthesizing?: Maybe<Array<InitialBsdasri>>;
  temporaryStorageDetail?: Maybe<TemporaryStorageDetail>;
}

export enum WorkflowDisplayType {
  GRP = "Grp",
  TRANSIT = "Transit",
  SYNTH = "Synth",

  DEFAULT = "",
}
