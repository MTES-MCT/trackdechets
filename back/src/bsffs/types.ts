import { Prisma } from "@td/prisma";

export const BsffWithTransportersInclude = {
  transporters: true
} satisfies Prisma.BsffInclude;

export type BsffWithTransporters = Prisma.BsffGetPayload<{
  include: typeof BsffWithTransportersInclude;
}>;

export const BsffWithPackagingsInclude = {
  packagings: {
    include: {
      ficheInterventions: true
    }
  }
} satisfies Prisma.BsffInclude;

export type BsffWithPackagings = Prisma.BsffGetPayload<{
  include: typeof BsffWithPackagingsInclude;
}>;

export const BsffWithPackagingsAndDetenteursInclude = {
  packagings: {
    include: {
      ficheInterventions: true,
      detenteurs: true
    }
  }
} satisfies Prisma.BsffInclude;

export type BsffWithPackagingsAndDetenteurs = Prisma.BsffGetPayload<{
  include: typeof BsffWithPackagingsAndDetenteursInclude;
}>;

export const BsffWithFicheInterventionInclude = {
  ficheInterventions: true
} satisfies Prisma.BsffInclude;

export type BsffWithFicheInterventions = Prisma.BsffGetPayload<{
  include: typeof BsffWithFicheInterventionInclude;
}>;
