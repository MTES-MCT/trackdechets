import { QueryResolvers } from "../../../generated/graphql/types";
import getWasteConnection from "../../wastes";
import { checkIsAuthenticated } from "../../../common/permissions";
import { Permission, checkUserPermissions } from "../../../permissions";

const allWastesResolver: QueryResolvers["allWastes"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  for (const siret of args.sirets) {
    await checkUserPermissions(
      user,
      [siret].filter(Boolean),
      Permission.RegistryCanRead,
      `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le n°SIRET ${siret}`
    );
  }

  return getWasteConnection("ALL", args);
};

export default allWastesResolver;
