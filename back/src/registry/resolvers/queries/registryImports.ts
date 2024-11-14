import { Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { getConnection } from "../../../common/pagination";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryRegistryImportsArgs } from "../../../generated/graphql/types";
import { Permission, checkUserPermissions } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";

export async function registryImports(
  _,
  { siret, ownImportsOnly, ...gqlPaginationArgs }: QueryRegistryImportsArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const where: Prisma.RegistryImportWhereInput = {};

  if (!siret && !ownImportsOnly) {
    throw new UserInputError(
      "Vous devez spécifier un SIRET via le paramètre 'siret' ou préciser que vous souhaitez récupérer uniquement vos imports via le paramètre 'ownImportsOnly'"
    );
  }

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
