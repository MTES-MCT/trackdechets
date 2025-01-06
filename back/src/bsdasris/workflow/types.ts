import { Prisma } from "@prisma/client";
import type { BsdasriSignatureType } from "@td/codegen-back";

// Xstate event
export type BsdasriEvent = {
  type: BsdasriSignatureType;
  dasriUpdateInput?: Prisma.BsdasriUpdateInput;
};
