import { Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { getConnection } from "../../../common/pagination";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryRegistryImportsArgs } from "@td/codegen-back";
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
    const filteredOnCompany = await prisma.company.findUnique({
      where: { siret }
    });

    if (!filteredOnCompany) {
      throw new UserInputError("Impossible de filtrer sur ce SIRET");
    }

    const userCompanies = await getUserCompanies(user.id);
    const canReportForSirets = userCompanies.map(c => c.orgId);
    const isOwnReport = canReportForSirets.includes(siret);

    const delegations = await prisma.registryDelegation.findMany({
      where: {
        delegatorId: filteredOnCompany.id,
        revokedBy: null,
        cancelledBy: null,
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }]
      },
      include: { delegate: { select: { orgId: true } } }
    });

    const siretsThatHaveDelegationOnTarget = delegations.map(
      delegation => delegation.delegate.orgId
    );

    const siretsThatCanAccessRegistry = [
      siret,
      ...siretsThatHaveDelegationOnTarget
    ];

    await checkUserPermissions(
      user,
      siretsThatCanAccessRegistry,
      Permission.RegistryCanRead,
      `Vous n'êtes pas autorisé à lire les données de ce registre`
    );

    where.associations = {
      some: {
        reportedFor: siret,
        ...(!isOwnReport && {
          reportedAs: { in: siretsThatCanAccessRegistry }
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
