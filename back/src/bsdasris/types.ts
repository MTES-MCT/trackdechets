import { Bsdasri, Prisma } from "@td/prisma";

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

export const BsdasriWithGroupingInclude = {
  grouping: { select: { id: true } }
} satisfies Prisma.BsdasriInclude;

export type BsdasriWithGrouping = Prisma.BsdasriGetPayload<{
  include: typeof BsdasriWithGroupingInclude;
}>;

export const BsdasriWithSynthesizingInclude = {
  synthesizing: { select: { id: true } }
} satisfies Prisma.BsdasriInclude;

export type BsdasriWithSynthesizing = Prisma.BsdasriGetPayload<{
  include: typeof BsdasriWithSynthesizingInclude;
}>;

export const BsdasriRevisionRequestWithAuthoringCompanyInclude = {
  authoringCompany: { select: { orgId: true } }
} satisfies Prisma.BsdasriRevisionRequestInclude;
export const BsdasriRevisionRequestWithApprovalsInclude = {
  approvals: { select: { approverSiret: true } }
} satisfies Prisma.BsdasriRevisionRequestInclude;

export const BsdasriWithRevisionRequestsInclude = {
  bsdasriRevisionRequests: {
    include: {
      ...BsdasriRevisionRequestWithAuthoringCompanyInclude,
      ...BsdasriRevisionRequestWithApprovalsInclude
    }
  }
} satisfies Prisma.BsdasriInclude;

export type BsdasriWithRevisionRequests = Prisma.BsdasriGetPayload<{
  include: typeof BsdasriWithRevisionRequestsInclude;
}>;

export const BsdasriWithIntermediariesInclude = {
  intermediaries: true
} satisfies Prisma.BsdasriInclude;

export type BsdasriWithIntermediaries = Prisma.BsdasriGetPayload<{
  include: typeof BsdasriWithIntermediariesInclude;
}>;
