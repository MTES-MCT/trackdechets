import { Bsdasri } from "@prisma/client";

/**
 * A Prisma Dasri with owner user type
 */

export type BsdasriSirets = Pick<
  Bsdasri,
  "emitterCompanySiret" | "destinationCompanySiret" | "transporterCompanySiret"
>;

export interface FullDbBsdasri extends Bsdasri {
  grouping: { id: string }[];
  synthesizing: { id: string }[];
}
