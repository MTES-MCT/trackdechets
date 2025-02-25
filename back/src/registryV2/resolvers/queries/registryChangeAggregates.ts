import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryRegistryChangeAggregatesArgs } from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { sub } from "date-fns";

export async function registryChangeAggregates(
  _,
  { siret, window, source }: QueryRegistryChangeAggregatesArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const filteredOnCompany = await prisma.company.findUnique({
    where: { siret }
  });
  if (!filteredOnCompany) {
    throw new UserInputError("Impossible de filtrer sur ce SIRET");
  }

  if (window > 30) {
    throw new UserInputError(
      "La fenêtre de temps ne peut pas dépasser 30 jours"
    );
  }

  const userCompanies = await getUserCompanies(user.id);
  const userCompanyIds = userCompanies.map(c => c.id);

  const siretsThatCanAccessAggregates = [siret];
  const reportAsIdsFilter: string[] = [];

  if (!userCompanyIds.includes(filteredOnCompany.id)) {
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
    siretsThatCanAccessAggregates.push(...siretsThatHaveDelegationOnTarget);

    const companyIdsThatHaveDelegationOnTarget = delegations.map(
      delegation => delegation.delegateId
    );
    reportAsIdsFilter.push(...companyIdsThatHaveDelegationOnTarget);
  }

  await checkUserPermissions(
    user,
    siretsThatCanAccessAggregates,
    Permission.RegistryCanRead,
    `Vous n'êtes pas autorisé à lire les informations pour ce siret`
  );

  return prisma.registryChangeAggregate.findMany({
    where: {
      reportForId: filteredOnCompany.id,
      ...(reportAsIdsFilter.length > 0 && {
        reportAsId: { in: reportAsIdsFilter }
      }),
      source,
      createdAt: {
        gte: sub(new Date(), { days: window })
      }
    },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      reportAs: { select: { name: true, siret: true } }
    }
  });
}
