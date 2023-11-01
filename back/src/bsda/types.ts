import { Prisma } from "@prisma/client";

export const BsdaWithIntermediariesInclude =
  Prisma.validator<Prisma.BsdaInclude>()({
    intermediaries: true
  });

export type BsdaWithIntermediaries = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithIntermediariesInclude;
}>;

export const BsdaWithForwardedInInclude =
  Prisma.validator<Prisma.BsdaInclude>()({
    forwardedIn: { select: { id: true } }
  });

export type BsdaWithForwardedIn = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithForwardedInInclude;
}>;

export const BsdaWithGroupedInInclude = Prisma.validator<Prisma.BsdaInclude>()({
  forwardedIn: { select: { id: true } }
});

export type BsdaWithGroupedIn = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithGroupedInInclude;
}>;

export const BsdaRevisionRequestWithAuthoringCompanyInclude =
  Prisma.validator<Prisma.BsdaRevisionRequestInclude>()({
    authoringCompany: { select: { orgId: true } }
  });

export type BsdaRevisionRequestWithAuthoringCompany =
  Prisma.BsdaRevisionRequestGetPayload<{
    include: typeof BsdaRevisionRequestWithAuthoringCompanyInclude;
  }>;

export const BsdaRevisionRequestWithApprovalsInclude =
  Prisma.validator<Prisma.BsdaRevisionRequestInclude>()({
    approvals: { select: { approverSiret: true } }
  });

export type BsdaRevisionRequestWithApprovals =
  Prisma.BsdaRevisionRequestGetPayload<{
    include: typeof BsdaRevisionRequestWithApprovalsInclude;
  }>;

export const BsdaWithRevisionRequestsInclude =
  Prisma.validator<Prisma.BsdaInclude>()({
    BsdaRevisionRequest: {
      include: {
        ...BsdaRevisionRequestWithAuthoringCompanyInclude,
        ...BsdaRevisionRequestWithApprovalsInclude
      }
    }
  });

export type BsdaWithRevisionRequests = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithRevisionRequestsInclude;
}>;