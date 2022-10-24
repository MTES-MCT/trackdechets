import { Prisma } from "@prisma/client";

// Xstate event type
export enum BsdasriEventType {
  SignEmission = "SIGN_EMISSION",
  SignEmissionWithSecretCode = "SIGN_EMISSION_WITH_SECRET_CODE",
  SignTransport = "SIGN_TRANSPORT",
  SignReception = "SIGN_RECEPTION",
  SignOperation = "SIGN_OPERATION"
}

// Xstate event
export type BsdasriEvent = {
  type: BsdasriEventType;
  dasriUpdateInput?: Prisma.BsdasriUpdateInput;
};
