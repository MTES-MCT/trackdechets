import { Bsdasri, Prisma } from "@prisma/client";

/**
 * A Prisma Dasri with owner user type
 */

export type BsdasriSirets = Pick<
  Bsdasri,
  | "emitterCompanySiret"
  | "destinationCompanySiret"
  | "transporterCompanySiret"
  | "transporterCompanyVatNumber"
> &
  Partial<Pick<Bsdasri, "ecoOrganismeSiret">>;

export interface FullDbBsdasri extends Bsdasri {
  grouping: { id: string }[];
  synthesizing: { id: string }[];
}

export const BsdasriWithGroupingInclude =
  Prisma.validator<Prisma.BsdasriInclude>()({
    grouping: { select: { id: true } }
  });

export type BsdasriWithGrouping = Prisma.BsdasriGetPayload<{
  include: typeof BsdasriWithGroupingInclude;
}>;

export const BsdasriWithSynthesizingInclude =
  Prisma.validator<Prisma.BsdasriInclude>()({
    synthesizing: { select: { id: true } }
  });

export type BsdasriWithSynthesizing = Prisma.BsdasriGetPayload<{
  include: typeof BsdasriWithSynthesizingInclude;
}>;

export const BsdasriRevisionRequestWithAuthoringCompanyInclude =
  Prisma.validator<Prisma.BsdasriRevisionRequestInclude>()({
    authoringCompany: { select: { orgId: true } }
  });
export const BsdasriRevisionRequestWithApprovalsInclude =
  Prisma.validator<Prisma.BsdasriRevisionRequestInclude>()({
    approvals: { select: { approverSiret: true } }
  });

export const BsdasriWithRevisionRequestsInclude =
  Prisma.validator<Prisma.BsdasriInclude>()({
    bsdasriRevisionRequests: {
      include: {
        ...BsdasriRevisionRequestWithAuthoringCompanyInclude,
        ...BsdasriRevisionRequestWithApprovalsInclude
      }
    }
  });

export type BsdasriWithRevisionRequests = Prisma.BsdasriGetPayload<{
  include: typeof BsdasriWithRevisionRequestsInclude;
}>;
