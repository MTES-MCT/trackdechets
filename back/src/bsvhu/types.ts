import { Prisma } from "@prisma/client";

export const BsvhuWithIntermediariesInclude =
  Prisma.validator<Prisma.BsvhuInclude>()({
    intermediaries: true
  });

export type BsvhuWithIntermediaries = Prisma.BsvhuGetPayload<{
  include: typeof BsvhuWithIntermediariesInclude;
}>;
