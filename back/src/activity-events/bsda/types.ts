import { Prisma, BsdaStatus } from "@td/prisma";
import { ActivityEvent } from "..";
import { RevisionRequestContent } from "../../bsda/resolvers/mutations/revisionRequest/createRevisionRequest";

export type BsdaEvent =
  | BsdaCreated
  | BsdaUpdated
  | BsdaSigned
  | BsdaDeleted
  | BsdaRevisionRequestApplied;

export type BsdaRevisionRequestEvent =
  | BsdaRevisionRequestCreated
  | BsdaRevisionRequestApproved
  | BsdaRevisionRequestRefused;

export type BsdaCreated = ActivityEvent<"BsdaCreated", Prisma.BsdaCreateInput>;
export type BsdaUpdated = ActivityEvent<"BsdaUpdated", Prisma.BsdaUpdateInput>;
export type BsdaSigned = ActivityEvent<
  "BsdaSigned",
  {
    status: BsdaStatus;
  }
>;
export type BsdaDeleted = ActivityEvent<"BsdaDeleted", Record<string, never>>;
export type BsdaRevisionRequestApplied = ActivityEvent<
  "BsdaRevisionRequestApplied",
  {
    revisionRequestId: string;
    content: RevisionRequestContent;
  }
>;

export type BsdaRevisionRequestCreated = ActivityEvent<
  "BsdaRevisionRequestCreated",
  {
    authoringSiret: string;
    content: RevisionRequestContent;
  }
>;
export type BsdaRevisionRequestApproved = ActivityEvent<
  "BsdaRevisionRequestApproved",
  {
    authoringSiret: string;
  }
>;
export type BsdaRevisionRequestRefused = ActivityEvent<
  "BsdaRevisionRequestRefused",
  {
    authoringSiret: string;
  }
>;
