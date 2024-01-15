import {
  Prisma,
  Bspaoh as PrismaBspaoh,
  BspaohTransporter as PrismaBspaohTransporter
} from "@prisma/client";

export const BspaohIncludes = Prisma.validator<Prisma.BspaohInclude>()({
  transporters: true
});

export type PrismaBspaohWithTransporters = Prisma.BspaohGetPayload<{
  include: typeof BspaohIncludes;
}>;

export type BspaohForParsing = PrismaBspaoh &
  Omit<PrismaBspaohTransporter, "id" | "bspaohId">;
