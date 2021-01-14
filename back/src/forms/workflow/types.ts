import { Prisma } from "@prisma/client";

// Xstate possible states
export enum FormState {
  Draft = "DRAFT",
  Sealed = "SEALED",
  Sent = "SENT",
  Received = "RECEIVED",
  Accepted = "ACCEPTED",
  Refused = "REFUSED",
  Processed = "PROCESSED",
  NoTraceability = "NO_TRACEABILITY",
  AwaitingGroup = "AWAITING_GROUP",
  Grouped = "GROUPED",
  TempStored = "TEMP_STORED",
  TempStorerAccepted = "TEMP_STORER_ACCEPTED",
  Resealed = "RESEALED",
  Resent = "RESENT"
}

// Xstate event type
export enum EventType {
  MarkAsSealed = "MARK_AS_SEALED",
  MarkAsSent = "MARK_AS_SENT",
  SignedByTransporter = "SIGNED_BY_TRANSPORTER",
  MarkAsReceived = "MARK_AS_RECEIVED",
  MarkAsAccepted = "MARK_AS_ACCEPTED",
  MarkAsProcessed = "MARK_AS_PROCESSED",
  MarkAsTempStored = "MARK_AS_TEMP_STORED",
  MarkAsTempStorerAccepted = "MARK_AS_TEMP_STORER_ACCEPTED",
  MarkAsResealed = "MARK_AS_RESEALED",
  MarkAsResent = "MARK_AS_RESENT",
  MarkAsGrouped = "MARK_AS_GROUPED",
  ImportPaperForm = "IMPORT_PAPER_FORM"
}

// Xstate event
export type Event = {
  type: EventType;
  formUpdateInput?: Prisma.FormUpdateInput;
};
