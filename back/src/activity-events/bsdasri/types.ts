import { Prisma, BsdasriStatus } from "@prisma/client";
import { ActivityEvent } from "..";
import { RevisionRequestContent } from "../../bsda/resolvers/mutations/revisionRequest/createRevisionRequest";

export type BsdasriEvent =
  | BsdasriCreated
  | BsdasriUpdated
  | BsdasriSigned
  | BsdasriDeleted
  | BsdasriRevisionRequestApplied;

export type BsdasriRevisionRequestEvent =
  | BsdasriRevisionRequestCreated
  | BsdasriRevisionRequestApproved
  | BsdasriRevisionRequestRefused;

export type BsdasriCreated = ActivityEvent<
  "BsdasriCreated",
  Prisma.BsdasriCreateInput
>;
export type BsdasriUpdated = ActivityEvent<
  "BsdasriUpdated",
  Prisma.BsdasriUpdateInput
>;
export type BsdasriSigned = ActivityEvent<
  "BsdasriSigned",
  {
    status: BsdasriStatus;
  }
>;
export type BsdasriDeleted = ActivityEvent<
  "BsdasriDeleted",
  Record<string, never>
>;
export type BsdasriRevisionRequestApplied = ActivityEvent<
  "BsdasriRevisionRequestApplied",
  {
    revisionRequestId: string;
    content: RevisionRequestContent;
  }
>;

export type BsdasriRevisionRequestCreated = ActivityEvent<
  "BsdasriRevisionRequestCreated",
  {
    authoringSiret: string;
    content: RevisionRequestContent;
  }
>;
export type BsdasriRevisionRequestApproved = ActivityEvent<
  "BsdasriRevisionRequestApproved",
  {
    authoringSiret: string;
  }
>;
export type BsdasriRevisionRequestRefused = ActivityEvent<
  "BsdasriRevisionRequestRefused",
  {
    authoringSiret: string;
  }
>;
