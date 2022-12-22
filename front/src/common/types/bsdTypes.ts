import {
  BsdaEcoOrganisme,
  BsdaWeight,
  BsdType,
  BsffWeight,
  BsvhuWeight,
  Maybe,
  Scalars,
} from "generated/graphql/types";

export enum BsdTypename {
  Bsdd = "Form",
  Bsda = "Bsda",
  Bsdasri = "Bsdasri",
  Bsvhu = "Bsvhu",
  Bsff = "Bsff",
}

export enum BsdStatusCode {
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
  type?: BsdType | undefined;
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
  updatedAt?: Maybe<string> | Maybe<Scalars["DateTime"]>;
  emittedByEcoOrganisme?: Maybe<boolean> | Maybe<BsdaEcoOrganisme>;
}
