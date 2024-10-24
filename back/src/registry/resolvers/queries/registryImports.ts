import { prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryRegistryImportsArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { getConnection } from "../../../common/pagination";
import { Permission, checkUserPermissions } from "../../../permissions";
import { Prisma } from "@prisma/client";

export async function registryImports(
  _,
  { siret, ownImportsOnly, ...gqlPaginationArgs }: QueryRegistryImportsArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const where: Prisma.RegistryImportWhereInput = {};

  if (siret) {
    const userCompanies = await getUserCompanies(user.id);
    const canReportForSirets = userCompanies.map(c => c.orgId);
    const isOwnReport = canReportForSirets.includes(siret);

    const siretsThatHaveDelegationOnTarget: string[] = []; // TODO delegations where target siret = input

    await checkUserPermissions(
      user,
      [siret, ...siretsThatHaveDelegationOnTarget],
      Permission.RegistryCanRead,
      `Vous n'êtes pas autorisé à lire les données de ce registre`
    );

    where.associations = {
      some: {
        reportedFor: siret,
        ...(!isOwnReport && {
          reportedAs: { in: siretsThatHaveDelegationOnTarget }
        })
      }
    };
  }

  if (ownImportsOnly) {
    where.createdById = user.id;
  }

  const totalCount = await prisma.registryImport.count({ where });

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.registryImport.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { id: "desc" },
        include: { createdBy: true, associations: true }
      }),
    formatNode: v => v,
    ...gqlPaginationArgs
  });
}
