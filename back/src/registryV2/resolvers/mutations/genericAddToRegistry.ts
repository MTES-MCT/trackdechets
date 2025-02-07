import { pluralize } from "@td/constants";
import { prisma } from "@td/prisma";
import {
  UNAUTHORIZED_ERROR,
  type ImportOptions,
  isAuthorized
} from "@td/registry";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { Permission, checkUserPermissions } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";

const LINES_LIMIT = 1_000;

type UnparsedLine = {
  reason?: "MODIFIER" | "ANNULER" | "IGNORER" | "EDIT" | "CANCEL" | null;
  publicId: string;
  reportForCompanySiret: string;
  reportAsCompanySiret?: string | null;
};

export async function genericAddToRegistry<T extends UnparsedLine>(
  importOptions: ImportOptions,
  lines: T[],
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const userCompanies = await getUserCompanies(user.id);
  await checkUserPermissions(
    user,
    userCompanies.map(company => company.orgId),
    Permission.RegistryCanImport,
    `Vous n'êtes pas autorisé à modifier des données du registre`
  );

  if (lines.length > LINES_LIMIT) {
    throw new UserInputError(
      `Vous ne pouvez pas importer plus de ${LINES_LIMIT} lignes par appel`
    );
  }

  const userSirets = userCompanies.map(company => company.orgId);
  const userCompanyIds = userCompanies.map(company => company.id);
  const givenDelegations = await prisma.registryDelegation.findMany({
    where: {
      delegateId: { in: userCompanyIds },
      revokedBy: null,
      cancelledBy: null,
      startDate: { lte: new Date() },
      OR: [{ endDate: null }, { endDate: { gt: new Date() } }]
    }
  });
  const delegateToDelegatorsMap = givenDelegations.reduce((map, delegation) => {
    const currentValue = map.get(delegation.delegateId) ?? [];
    currentValue.push(delegation.delegatorId);

    map.set(delegation.delegateId, currentValue);
    return map;
  }, new Map<string, string[]>());

  const { safeParseAsync, saveLine } = importOptions;
  const errors = new Map<string, string>();

  for (const line of lines) {
    const result = await safeParseAsync(line);

    if (result.success) {
      const { reportAsCompanySiret, reportForCompanySiret } = result.data;

      if (
        !isAuthorized({
          reportAsCompanySiret,
          delegateToDelegatorsMap,
          reportForCompanySiret,
          allowedSirets: userSirets
        })
      ) {
        errors.set(line.publicId, UNAUTHORIZED_ERROR);
        continue;
      }

      await saveLine({
        line: { ...result.data, createdById: user.id },
        importId: null
      });
    } else {
      errors.set(
        line.publicId,
        result.error.issues
          .map(issue => `${issue.path}: ${issue.message}`)
          .join("\n")
      );
    }
  }

  if (errors.size > 0) {
    throw new UserInputError(
      `${errors.size} ${pluralize(
        "ligne en erreur n'a pas pu être importée",
        errors.size,
        "lignes en erreur n'ont pas pu être importées"
      )}.`,
      {
        errors: Array.from(errors.entries()).map(([publicId, errors]) => ({
          message: errors,
          publicId
        }))
      }
    );
  }

  return true;
}
