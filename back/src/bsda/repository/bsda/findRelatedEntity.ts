import { Bsda, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../forms/repository/types";

type ChainableBsda = Pick<
  Prisma.Prisma__BsdaClient<Bsda>,
  "forwardedIn" | "forwarding" | "groupedIn" | "grouping"
>;

export type FindRelatedEntityFn = (
  where: Prisma.BsdaWhereUniqueInput
) => ChainableBsda;

export function buildFindRelatedBsdaEntity({
  prisma
}: ReadRepositoryFnDeps): FindRelatedEntityFn {
  return where => {
    return prisma.bsda.findUnique({ where });
  };
}
