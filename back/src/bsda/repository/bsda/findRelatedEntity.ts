import { Bsda, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

type ChainableBsda = Pick<
  Prisma.Prisma__BsdaClient<Bsda | null, null>,
  | "forwardedIn"
  | "forwarding"
  | "groupedIn"
  | "grouping"
  | "intermediaries"
  | "bsdaRevisionRequests"
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
