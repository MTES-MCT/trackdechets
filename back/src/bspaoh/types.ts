import {
  Prisma,
  Bspaoh as PrismaBspaoh,
  BspaohTransporter as PrismaBspaohTransporter
} from "@td/prisma";

export const BspaohIncludes = {
  transporters: true
} satisfies Prisma.BspaohInclude;

export type PrismaBspaohWithTransporters = Prisma.BspaohGetPayload<{
  include: typeof BspaohIncludes;
}>;

export type BspaohForParsing = PrismaBspaoh &
  Omit<PrismaBspaohTransporter, "id" | "bspaohId">;
