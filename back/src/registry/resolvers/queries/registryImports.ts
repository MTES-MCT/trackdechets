import { prisma } from "@td/prisma";
import { ForbiddenError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryRegistryImportsArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { getConnection } from "../../../common/pagination";

export async function registryImports(
  _,
  { siret, ...gqlPaginationArgs }: QueryRegistryImportsArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const userCompanies = await getUserCompanies(user.id);

  const canReportForSirets = userCompanies.map(c => c.orgId);
  const canReportAsSirets: string[] = []; // TODO delegations where target siret = input

  const isOwnReport = canReportForSirets.includes(siret);

  if (!isOwnReport && canReportAsSirets.length === 0) {
    throw new ForbiddenError(
      "Vous n'avez pas les droits pour consulter les imports de ce SIRET."
    );
  }

  const where = {
    sirets: {
      some: {
        reportedFor: siret,
        ...(!isOwnReport && {
          reportedAs: { in: canReportAsSirets }
        })
      }
    }
  };

  const totalCount = await prisma.registryImport.count({ where });

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.registryImport.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { id: "desc" },
        include: { createdBy: true }
      }),
    formatNode: v => v,
    ...gqlPaginationArgs
  });
}
