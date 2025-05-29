import { prisma } from "@td/prisma";
import {
  MutationCancelRegistryV2LinesArgs,
  CancelRegistryV2LineResponse
} from "@td/codegen-back";
import {
  incrementLocalChangesForCompany,
  RegistryChanges,
  importOptions,
  saveCompaniesChanges
} from "@td/registry";
import { GraphQLContext } from "../../../types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getUserCompanies } from "../../../users/database";
import { Permission, checkUserPermissions } from "../../../permissions";
import { ForbiddenError, UserInputError } from "../../../common/errors";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { getDelegatesOfCompany } from "../../../registryDelegation/resolvers/queries/utils/registryDelegations.utils";
import { getTypeFilter } from "../queries/utils/registryLookup.util";

export async function cancelRegistryV2Lines(
  _,
  { publicIds, siret, delegateSiret, type }: MutationCancelRegistryV2LinesArgs,
  context: GraphQLContext
): Promise<CancelRegistryV2LineResponse> {
  const user = checkIsAuthenticated(context);
  const userCompanies = await getUserCompanies(user.id);

  try {
    await checkUserPermissions(
      user,
      [siret],
      Permission.RegistryCanImport,
      `Vous n'êtes pas autorisé à modifier les données de ce registre`
    );
  } catch (error) {
    if (!delegateSiret) {
      throw error;
    }
    if (!userCompanies.some(company => company.orgId === delegateSiret)) {
      throw new ForbiddenError(
        `Vous n'êtes pas autorisé à modifier les données de ce registre en tant que délégataire`
      );
    }
    const delegatorCompany = await getCompanyOrCompanyNotFound({
      siret
    });
    // list the companies that have delegation for this siret
    const delegatesForCompany = await getDelegatesOfCompany(
      user,
      delegatorCompany.id
    );
    if (delegatesForCompany.length === 0) {
      throw new ForbiddenError(
        `Vous n'êtes pas autorisé à modifier les données de ce registre en tant que délégataire`
      );
    }
    if (
      !delegatesForCompany.some(delegate => delegate.orgId === delegateSiret)
    ) {
      throw new ForbiddenError(
        `L'entreprise spécifiée dans le champ delegate n'a pas de délégation sur l'entreprise spécifiée dans le champ siret.`
      );
    }
    await checkUserPermissions(
      user,
      [delegateSiret],
      Permission.RegistryCanImport,
      `Vous n'êtes pas autorisé à modifier les données de ce registre en tant que délégataire`
    );
  }
  const uniquePublicIds = [...new Set(publicIds)];
  const linesInDb = await prisma.registryLookup.findMany({
    where: {
      readableId: { in: uniquePublicIds },
      siret: siret,
      ...getTypeFilter(type)
    }
  });
  if (linesInDb.length !== uniquePublicIds.length) {
    throw new UserInputError(
      `Impossible d'annuler les lignes ${uniquePublicIds.filter(
        id => !linesInDb.some(line => line.readableId === id)
      )} car elles n'existent pas`
    );
  }
  const { saveLine } = importOptions[type];
  const changesByCompany = new Map<
    string,
    { [reportAsSiret: string]: RegistryChanges }
  >();
  incrementLocalChangesForCompany(changesByCompany, {
    reason: "ANNULER",
    reportForCompanySiret: siret,
    reportAsCompanySiret: delegateSiret ?? siret,
    increments: uniquePublicIds.length
  });

  await saveCompaniesChanges(changesByCompany, {
    type: type,
    source: "API",
    createdById: user.id
  });
  for (const lineInDb of linesInDb) {
    await saveLine({
      line: {
        id: lineInDb.id,
        publicId: lineInDb.readableId,
        reportForCompanySiret: lineInDb.siret,
        reportAsCompanySiret: lineInDb.reportAsSiret,
        reason: "ANNULER",
        createdById: user.id
      },
      importId: null
    });
  }
  return {
    publicIds: uniquePublicIds
  };
}
