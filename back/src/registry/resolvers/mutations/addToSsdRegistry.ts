import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationAddToSsdRegistryArgs } from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { UserInputError } from "../../../common/errors";
import { importOptions } from "@td/registry";

const LINES_LIMIT = 1_000;

export async function addToSsdRegistry(
  _,
  { lines }: MutationAddToSsdRegistryArgs,
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
      `Cannot import more than ${LINES_LIMIT} lines at once`
    );
  }

  const { safeParseAsync, saveLine } = importOptions.SSD;

  for (const line of lines) {
    const result = await safeParseAsync(line);

    if (result.success) {
      await saveLine({ line: result.data, importId: null });
    } else {
      throw new UserInputError(
        `Invalid line: ${JSON.stringify(line)}: ${result.error.format()}`
      );
    }
  }

  return true;
}
