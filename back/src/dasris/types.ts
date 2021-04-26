import { Bsdasri, User } from "@prisma/client";

/**
 * A Prisma Dasri with owner user type
 */
export interface FullBsdasri extends Bsdasri {
  owner: User;
}

export type BsdasriSirets = Pick<
  Bsdasri,
  "emitterCompanySiret" | "recipientCompanySiret" | "transporterCompanySiret"
>;
