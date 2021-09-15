import { Bsdasri } from "@prisma/client";

/**
 * A Prisma Dasri with owner user type
 */

export type BsdasriSirets = Pick<
  Bsdasri,
  "emitterCompanySiret" | "destinationCompanySiret" | "transporterCompanySiret"
>;
