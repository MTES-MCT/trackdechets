import { Prisma } from "@prisma/client";

// Xstate possible states
export enum DasriState {
  Draft = "DRAFT",
  Sealed = "SEALED", // we keep this terminology for now, although it is a bit confusing
  ReadyForTakeover = "READY_FOR_TAKEOVER",
  Sent = "SENT",
  Received = "RECEIVED",
  Processed = "PROCESSED",
  Refused = "REFUSED"
}

// Xstate event type
export enum DasriEventType {
  MarkAsReady = "MARK_AS_READY", // not very happy with the SENT naming
  SignEmission = "SIGN_EMISSION",
  SignEmissionWithSecretCode = "SIGN_EMISSION_WITH_SECRET_CODE",
  SignTransport = "SIGN_TRANSPORT",
  SignReception = "SIGN_RECEPTION",
  SignOperation = "SIGN_OPERATION"
}

// Xstate event
export type DasriEvent = {
  type: DasriEventType;
  dasriUpdateInput?: Prisma.DasriUpdateInput;
};
