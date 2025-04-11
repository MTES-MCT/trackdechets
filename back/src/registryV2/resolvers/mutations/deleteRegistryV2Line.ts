import { prisma } from "@td/prisma";
import {
  MutationDeleteRegistryV2LineArgs,
  DeleteRegistryV2LineResponse
} from "@td/codegen-back";
import {
  incrementLocalChangesForCompany,
  RegistryChanges,
  importOptions
} from "@td/registry";
import { GraphQLContext } from "../../../types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getUserCompanies } from "../../../users/database";
import {
  Permission,
  checkUserPermissions,
  hasGovernmentRegistryPerm
} from "../../../permissions";
import { ForbiddenError, UserInputError } from "../../../common/errors";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { getDelegatesOfCompany } from "../../../registryDelegation/resolvers/queries/utils/registryDelegations.utils";
import { getTypeFilter } from "../queries/utils/registryLookup.util";

export async function deleteRegistryV2Line(
  _,
  { publicId, siret, delegateSiret, type }: MutationDeleteRegistryV2LineArgs,
  context: GraphQLContext
): Promise<DeleteRegistryV2LineResponse> {
  const user = checkIsAuthenticated(context);
  const userCompanies = await getUserCompanies(user.id);
  const hasGovernmentPermission = await hasGovernmentRegistryPerm(user, [
    siret
  ]);
  if (!hasGovernmentPermission) {
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
  }

  const lineInDb = await prisma.registryLookup.findFirst({
    where: {
      readableId: publicId,
      siret: siret,
      ...getTypeFilter(type)
    }
  });
  if (!lineInDb) {
    throw new UserInputError(
      `Impossible de supprimer la ligne ${publicId} car elle n'existe pas`
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
    reportAsCompanySiret: delegateSiret ?? siret
  });

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
  return {
    publicId: lineInDb.readableId
  };
}
