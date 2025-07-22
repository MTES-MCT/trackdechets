import { Prisma } from "@prisma/client";

export const BsffWithTransportersInclude =
  Prisma.validator<Prisma.BsffInclude>()({
    transporters: true
  });

export type BsffWithTransporters = Prisma.BsffGetPayload<{
  include: typeof BsffWithTransportersInclude;
}>;

export const BsffWithPackagingsInclude = Prisma.validator<Prisma.BsffInclude>()(
  {
    packagings: {
      include: {
        ficheInterventions: true
      }
    }
  }
);

export type BsffWithPackagings = Prisma.BsffGetPayload<{
  include: typeof BsffWithPackagingsInclude;
}>;

export const BsffWithFicheInterventionInclude =
  Prisma.validator<Prisma.BsffInclude>()({
    ficheInterventions: true
  });

export type BsffWithFicheInterventions = Prisma.BsffGetPayload<{
  include: typeof BsffWithFicheInterventionInclude;
}>;
