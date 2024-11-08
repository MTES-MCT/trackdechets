import { prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryRegistryExportsArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { getConnection } from "../../../common/pagination";
import {
  Permission,
  can,
  checkUserPermissions,
  hasGovernmentRegistryPerm
} from "../../../permissions";
import { Prisma } from "@prisma/client";
import { getDelegatesOfCompany } from "../../../registryDelegation/resolvers/queries/utils/registryDelegations.utils";
import { ForbiddenError, UserInputError } from "../../../common/errors";

export async function registryExports(
  _,
  {
    siret,
    delegateSiret,
    ownImportsOnly,
    ...gqlPaginationArgs
  }: QueryRegistryExportsArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const sirets: string[] = [];
  let delegate: string | null = null;

  if (delegateSiret && !siret) {
    throw new UserInputError(
      "Le champ siret est obligatoire si les exports sont demandés en tant que délégataire."
    );
  }
  const userCompanies = await getUserCompanies(user.id);
  // if a siret is specified, we check that the user as read access for this company
  // or he has read access to a company, specified in "delegateSiret", that is in fact a delegate for this company
  if (siret) {
    const hasGovernmentPermission = await hasGovernmentRegistryPerm(user, [
      siret
    ]);
    // bypass authorization if the user is authenticated from a service account or is admin
    if (!hasGovernmentPermission && !user.isAdmin) {
      try {
        await checkUserPermissions(
          user,
          [siret],
          Permission.RegistryCanRead,
          `Vous n'êtes pas autorisé à lire les données de ce registre`
        );
      } catch (error) {
        if (!delegateSiret) {
          throw error;
        }
        if (!userCompanies.some(company => company.orgId === delegateSiret)) {
          throw new ForbiddenError(
            `Vous n'êtes pas autorisé à lire les données de ce registre en tant que délégataire`
          );
        }
        // list the companies that have delegation for this siret
        const delegatesForCompany = await getDelegatesOfCompany(user, siret);
        if (delegatesForCompany.length === 0) {
          throw new ForbiddenError(
            `Vous n'êtes pas autorisé à lire les données de ce registre en tant que délégataire`
          );
        }
        if (
          !delegatesForCompany.some(
            delegate => delegate.orgId === delegateSiret
          )
        ) {
          throw new ForbiddenError(
            `L'entreprise spécifiée dans le champ delegate n'a pas de délégation sur l'entreprise spécifiée dans le champ siret.`
          );
        }
        await checkUserPermissions(
          user,
          [delegateSiret],
          Permission.RegistryCanRead,
          `Vous n'êtes pas autorisé à lire les données de ce registre en tant que délégataire`
        );
        delegate = delegateSiret;
      }
    }
    sirets.push(siret);
  } else {
    const orgIds = userCompanies.map(company => company.orgId);
    const userRoles = await context.dataloaders.userRoles.load(user.id);

    for (const orgId of orgIds) {
      if (!user.isAdmin) {
        if (
          Object.keys(userRoles).includes(orgId) &&
          can(userRoles[orgId], Permission.RegistryCanRead)
        ) {
          sirets.push(orgId);
        }
      } else {
        sirets.push(orgId);
      }
    }
  }
  if (sirets.length === 0) {
    throw new ForbiddenError(
      `Vous n'êtes pas autorisé à lire les données d'export de registres`
    );
  }
  // the sirets array in the RegistryObject can either contain
  // 1 siret if it was exported for a specific siret,
  // or multiple sirets, corresponding to the sirets the user demanding
  // the export has access to.
  // Since we don't want someone who doesn't have access to one of those sirets
  // to read a registry that contains infos about it, we filter exports with "hasEvery"
  // so the user only sees export where he has access to all the sirets whose data was exported.
  const where: Prisma.RegistryExportWhereInput = {
    sirets: { hasEvery: sirets }
  };
  if (delegate) {
    where.delegateSiret = delegate;
  }
  if (ownImportsOnly) {
    where.createdById = user.id;
  }

  const totalCount = await prisma.registryExport.count({ where });

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.registryExport.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { id: "desc" },
        include: { createdBy: true }
      }),
    formatNode: v => v,
    ...gqlPaginationArgs
  });
}
