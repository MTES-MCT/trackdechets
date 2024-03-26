import { QueryWastesRegistryXlsArgs } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { searchBsds } from "../../elastic";
import { GraphQLContext } from "../../../types";
import { Permission, syncCheckUserPermissions } from "../../../permissions";
import { UserInputError } from "../../../common/errors";
import { TotalHits } from "@elastic/elasticsearch/api/types";
import { hasGovernmentRegistryPerm } from "../../permissions";

export async function checkWastesRegistryDownloadPermissions(
  args: QueryWastesRegistryXlsArgs,
  context: GraphQLContext
): Promise<void> {
  const user = checkIsAuthenticated(context);
  const userRoles = await context.dataloaders.userRoles.load(user.id);

  const hasGovernmentPermission = await hasGovernmentRegistryPerm(
    user,
    args.sirets
  );

  // bypass authorization if the user is authenticated from a service account
  if (!hasGovernmentPermission) {
    for (const siret of args.sirets) {
      syncCheckUserPermissions(
        userRoles,
        [siret].filter(Boolean),
        Permission.RegistryCanRead,
        `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le n°SIRET ${siret}`
      );
    }
  }
  const hits = await searchBsds(args.registryType, args.sirets, args.where, {
    size: 1,
    sort: [{ id: "ASC" }]
  });

  if ((hits.total as TotalHits).value === 0) {
    throw new UserInputError(
      "Aucune donnée à exporter sur la période sélectionnée"
    );
  }
}
