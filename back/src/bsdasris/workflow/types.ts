import { Prisma } from "@prisma/client";
import { BsdasriSignatureType } from "../../generated/graphql/types";

// Xstate event
export type BsdasriEvent = {
  type: BsdasriSignatureType;
  dasriUpdateInput?: Prisma.BsdasriUpdateInput;
};
