import { Prisma } from "@prisma/client";
import { RepositoryFnDeps } from "../../../common/repository/types";

export type DeleteFormStaleSegmentsFn = (
  where: Prisma.FormWhereUniqueInput
) => Promise<void>;

const buildDeleteFormStaleSegments: (
  deps: RepositoryFnDeps
) => DeleteFormStaleSegmentsFn = deps => async where => {
  const { prisma } = deps;

  const staleSegments = await prisma.form
    .findUnique({ where })
    .transportSegments({ where: { takenOverAt: null } });

  if (staleSegments && staleSegments.length > 0) {
    await prisma.bsddTransporter.deleteMany({
      where: { id: { in: staleSegments.map(s => s.id) } }
    });
  }
};

export default buildDeleteFormStaleSegments;
