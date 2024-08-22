import { QueryResolvers } from "../../../generated/graphql/types";
import getWasteConnection from "../../wastes";
import { checkIsAuthenticated } from "../../../common/permissions";

import {
  Permission,
  checkUserPermissions,
  hasGovernmentRegistryPerm
} from "../../../permissions";

const transportedWastesResolver: QueryResolvers["transportedWastes"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const hasGovernmentPermission = await hasGovernmentRegistryPerm(
    user,
    args.sirets
  );

  // bypass authorization if the user authenticated from a service account
  if (!hasGovernmentPermission) {
    for (const siret of args.sirets) {
      await checkUserPermissions(
        user,
        [siret].filter(Boolean),
        Permission.RegistryCanRead,
        `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le n°SIRET ${siret}`
      );
    }
  }

  return getWasteConnection("TRANSPORTED", args);
};

export default transportedWastesResolver;
