import { Prisma } from "@td/prisma";

export const BsffWithTransportersInclude = {
  transporters: true
} satisfies Prisma.BsffInclude;

export type BsffWithTransporters = Prisma.BsffGetPayload<{
  include: typeof BsffWithTransportersInclude;
}>;

export const BsffWithPackagingsInclude = {
  packagings: true
} satisfies Prisma.BsffInclude;

export type BsffWithPackagings = Prisma.BsffGetPayload<{
  include: typeof BsffWithPackagingsInclude;
}>;

export const BsffWithFicheInterventionInclude = {
  ficheInterventions: true
} satisfies Prisma.BsffInclude;

export type BsffWithFicheInterventions = Prisma.BsffGetPayload<{
  include: typeof BsffWithFicheInterventionInclude;
}>;
