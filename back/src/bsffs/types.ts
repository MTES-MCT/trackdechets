import { Prisma } from "@prisma/client";

export const BsffWithPackagingsInclude = Prisma.validator<Prisma.BsffInclude>()(
  {
    packagings: true
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
