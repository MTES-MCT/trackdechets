import { Prisma, Status } from "@td/prisma";
import { ActivityEvent } from "..";
import { RevisionRequestContent } from "../../forms/resolvers/mutations/createFormRevisionRequest";

export type BsddEvent =
  | BsddCreated
  | BsddUpdated
  | BsddSigned
  | BsddDeleted
  | BsddRevisionRequestApplied;

export type BsddRevisionRequestEvent =
  | BsddRevisionRequestCreated
  | BsddRevisionRequestApproved
  | BsddRevisionRequestRefused;

export type BsddCreated = ActivityEvent<
  "BsddCreated",
  {
    content: Prisma.FormCreateInput;
  }
>;
export type BsddUpdated = ActivityEvent<
  "BsddUpdated",
  {
    content: Prisma.FormUpdateInput;
  }
>;
export type BsddSigned = ActivityEvent<
  "BsddSigned",
  {
    status: Status;
  }
>;
export type BsddDeleted = ActivityEvent<"BsddDeleted", Record<string, never>>;
export type BsddRevisionRequestApplied = ActivityEvent<
  "BsddRevisionRequestApplied",
  {
    revisionRequestId: string;
    content: RevisionRequestContent;
  }
>;

export type BsddRevisionRequestCreated = ActivityEvent<
  "BsddRevisionRequestCreated",
  {
    authoringSiret: string;
    content: RevisionRequestContent;
  }
>;
export type BsddRevisionRequestApproved = ActivityEvent<
  "BsddRevisionRequestApproved",
  {
    authoringSiret: string;
  }
>;
export type BsddRevisionRequestRefused = ActivityEvent<
  "BsddRevisionRequestRefused",
  {
    authoringSiret: string;
  }
>;
