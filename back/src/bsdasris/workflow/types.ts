import { Prisma } from "@td/prisma";
import type { BsdasriSignatureType } from "@td/codegen-back";

// Xstate event
export type BsdasriEvent = {
  type: BsdasriSignatureType;
  dasriUpdateInput?: Prisma.BsdasriUpdateInput;
};
