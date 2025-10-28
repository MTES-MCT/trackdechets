import { Prisma } from "@td/prisma";

// Xstate event type
export enum EventType {
  MarkAsSealed = "MARK_AS_SEALED",
  SignedByProducer = "SIGNED_BY_PRODUCER",
  SignedByTransporter = "SIGNED_BY_TRANSPORTER",
  MarkAsReceived = "MARK_AS_RECEIVED",
  MarkAsAccepted = "MARK_AS_ACCEPTED",
  MarkAsProcessed = "MARK_AS_PROCESSED",
  MarkAsTempStored = "MARK_AS_TEMP_STORED",
  MarkAsTempStorerAccepted = "MARK_AS_TEMP_STORER_ACCEPTED",
  MarkAsResealed = "MARK_AS_RESEALED",
  SignedByTempStorer = "SIGNED_BY_TEMP_STORER",
  MarkAsResent = "MARK_AS_RESENT",
  MarkAsGrouped = "MARK_AS_GROUPED",
  ImportPaperForm = "IMPORT_PAPER_FORM"
}

// Xstate event
export type Event = {
  type: EventType;
  formUpdateInput?: Prisma.FormUpdateInput;
};
