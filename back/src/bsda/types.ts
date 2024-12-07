import { Prisma } from "@prisma/client";
import { BsdaSignatureType } from "@td/codegen-back";
import { MultiModalSignatureType } from "../common/types";

export const BsdaWithTransportersInclude =
  Prisma.validator<Prisma.BsdaInclude>()({
    transporters: true
  });

export type BsdaWithTransporters = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithTransportersInclude;
}>;

export const BsdaWithIntermediariesInclude =
  Prisma.validator<Prisma.BsdaInclude>()({
    intermediaries: true
  });

export type BsdaWithIntermediaries = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithIntermediariesInclude;
}>;

export const BsdaWithForwardingInclude = Prisma.validator<Prisma.BsdaInclude>()(
  {
    forwarding: true
  }
);

export type BsdaWithForwarding = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithForwardingInclude;
}>;

export const BsdaWithForwardedInInclude =
  Prisma.validator<Prisma.BsdaInclude>()({
    forwardedIn: { select: { id: true } }
  });

export type BsdaWithForwardedIn = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithForwardedInInclude;
}>;

export const BsdaWithGroupingInclude = Prisma.validator<Prisma.BsdaInclude>()({
  grouping: true
});

export type BsdaWithGrouping = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithGroupingInclude;
}>;

export const BsdaWithGroupedInInclude = Prisma.validator<Prisma.BsdaInclude>()({
  groupedIn: { select: { id: true } }
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
    bsdaRevisionRequests: {
      include: {
        ...BsdaRevisionRequestWithAuthoringCompanyInclude,
        ...BsdaRevisionRequestWithApprovalsInclude
      }
    }
  });

export type BsdaWithRevisionRequests = Prisma.BsdaGetPayload<{
  include: typeof BsdaWithRevisionRequestsInclude;
}>;

export type AllBsdaSignatureType = BsdaSignatureType | MultiModalSignatureType;
