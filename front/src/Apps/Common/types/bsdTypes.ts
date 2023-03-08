import {
  BsdaDestination,
  BsdaEcoOrganisme,
  BsdaEmitter,
  BsdasriDestination,
  BsdasriEcoOrganisme,
  BsdasriEmitter,
  BsdasriStatus,
  BsdasriTransporter,
  BsdasriType,
  BsdaStatus,
  BsdaTransporter,
  BsdaType,
  BsdaWeight,
  BsdaWorker,
  BsdType,
  BsffDestination,
  BsffEmitter,
  BsffPackaging,
  BsffStatus,
  BsffTransporter,
  BsffType,
  BsffWeight,
  BsvhuDestination,
  BsvhuEmitter,
  BsvhuStatus,
  BsvhuTransporter,
  BsvhuWeight,
  Emitter,
  EmitterType,
  FormEcoOrganisme,
  FormStatus,
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

export const BsdStatusCode = {
  ...FormStatus,
  ...BsdaStatus,
  ...BsffStatus,
  ...BsdasriStatus,
  ...BsvhuStatus,
};

type TBsdStatusCodeKeys = keyof typeof BsdStatusCode;
export type TBsdStatusCode = (typeof BsdStatusCode)[TBsdStatusCodeKeys];
export interface BsdDisplay {
  id: string;
  readableid: string;
  type: BsdType;
  isDraft: boolean;
  status: TBsdStatusCode;
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
  emitterType?: Maybe<EmitterType>;
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
  worker?: Maybe<BsdaWorker>;
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
