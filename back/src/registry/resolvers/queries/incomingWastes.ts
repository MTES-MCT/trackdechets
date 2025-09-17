import type { QueryResolvers } from "@td/codegen-back";
import getWasteConnection from "../../wastes";
import { checkIsAuthenticated } from "../../../common/permissions";

import {
  Permission,
  checkUserPermissions,
  hasGovernmentRegistryPerm
} from "../../../permissions";

const incomingWastesResolver: QueryResolvers["incomingWastes"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const hasGovernmentPermission = await hasGovernmentRegistryPerm(
    user,
    args.sirets
  );

  // bypass authorization if the user is authenticated from a service account
  if (!hasGovernmentPermission) {
    for (const siret of args.sirets) {
      await checkUserPermissions(
        user,
        [siret].filter(Boolean),
        Permission.RegistryCanRead,
        `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le SIRET ${siret}`
      );
    }
  }

  return getWasteConnection("INCOMING", args);
};

export default incomingWastesResolver;
