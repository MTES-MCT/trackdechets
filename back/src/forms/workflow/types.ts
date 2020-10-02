import { FormUpdateInput } from "../../generated/prisma-client";

// Xstate possible states
export enum FormState {
  Draft = "DRAFT",
  Sealed = "SEALED",
  Sent = "SENT",
  Received = "RECEIVED",
  Refused = "REFUSED",
  Processed = "PROCESSED",
  NoTraceability = "NO_TRACEABILITY",
  AwaitingGroup = "AWAITING_GROUP",
  Grouped = "GROUPED",
  TempStored = "TEMP_STORED",
  Resealed = "RESEALED",
  Resent = "RESENT"
}

// Xstate event type
export enum EventType {
  MarkAsSealed = "MARK_AS_SEALED",
  MarkAsSent = "MARK_AS_SENT",
  SignedByTransporter = "SIGNED_BY_TRANSPORTER",
  MarkAsReceived = "MARK_AS_RECEIVED",
  MarkAsProcessed = "MARK_AS_PROCESSED",
  MarkAsTempStored = "MARK_AS_TEMP_STORED",
  MarkAsResealed = "MARK_AS_RESEALED",
  MarkAsResent = "MARK_AS_RESENT",
  MarkAsGrouped = "MARK_AS_GROUPED",
  ImportPaperForm = "IMPORT_PAPER_FORM"
}

// Xstate event
export type Event = {
  type: EventType;
  formUpdateInput?: FormUpdateInput;
};
