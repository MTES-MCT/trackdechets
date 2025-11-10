import { Prisma } from "@td/prisma";
import type { BsdaSignatureType } from "@td/codegen-back";
import { MultiModalSignatureType } from "../common/types";

export const BsdaWithTransportersInclude = {
  transporters: true
} satisfies Prisma.BsdaInclude;

export type BsdaWithTransporters = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithTransportersInclude;
}>;

export const BsdaWithIntermediariesInclude = {
  intermediaries: true
} satisfies Prisma.BsdaInclude;

export type BsdaWithIntermediaries = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithIntermediariesInclude;
}>;

export const BsdaWithForwardingInclude = {
  forwarding: true
} satisfies Prisma.BsdaInclude;

export type BsdaWithForwarding = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithForwardingInclude;
}>;

export const BsdaWithForwardedInInclude = {
  forwardedIn: { select: { id: true } }
} satisfies Prisma.BsdaInclude;

export type BsdaWithForwardedIn = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithForwardedInInclude;
}>;

export const BsdaWithGroupingInclude = {
  grouping: true
} satisfies Prisma.BsdaInclude;

export type BsdaWithGrouping = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithGroupingInclude;
}>;

export const BsdaWithGroupedInInclude = {
  groupedIn: { select: { id: true } }
} satisfies Prisma.BsdaInclude;

export type BsdaWithGroupedIn = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithGroupedInInclude;
}>;

export const BsdaRevisionRequestWithAuthoringCompanyInclude = {
  authoringCompany: { select: { orgId: true } }
} satisfies Prisma.BsdaRevisionRequestInclude;

export type BsdaRevisionRequestWithAuthoringCompany =
  Prisma.BsdaRevisionRequestGetPayload<{
    include: typeof BsdaRevisionRequestWithAuthoringCompanyInclude;
  }>;

export const BsdaRevisionRequestWithApprovalsInclude = {
  approvals: { select: { approverSiret: true } }
} satisfies Prisma.BsdaRevisionRequestInclude;

export type BsdaRevisionRequestWithApprovals =
  Prisma.BsdaRevisionRequestGetPayload<{
    include: typeof BsdaRevisionRequestWithApprovalsInclude;
  }>;

export const BsdaWithRevisionRequestsInclude = {
  bsdaRevisionRequests: {
    include: {
      ...BsdaRevisionRequestWithAuthoringCompanyInclude,
      ...BsdaRevisionRequestWithApprovalsInclude
    }
  }
} satisfies Prisma.BsdaInclude;

export type BsdaWithRevisionRequests = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithRevisionRequestsInclude;
}>;

export type AllBsdaSignatureType = BsdaSignatureType | MultiModalSignatureType;
