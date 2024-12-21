import { checkIsAuthenticated } from "../../../common/permissions";
import { Permission, checkUserPermissions } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { UserInputError } from "../../../common/errors";
import type { ImportOptions } from "@td/registry";

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

  const { safeParseAsync, saveLine } = importOptions;

  for (const line of lines) {
    const result = await safeParseAsync(line);

    if (result.success) {
      await saveLine({
        line: { ...result.data, createdById: user.id },
        importId: null
      });
    } else {
      throw new UserInputError(
        [
          `Ligne avec l'identifiant ${line.publicId} invalide :`,
          ...result.error.issues.map(issue => `${issue.path}: ${issue.message}`)
        ].join("\n")
      );
    }
  }

  return true;
}
