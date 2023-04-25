import { QueryResolvers } from "../../../generated/graphql/types";
import getWasteConnection from "../../wastes";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsRegistreNational } from "../../permissions";
import { Permission, checkUserPermissions } from "../../../permissions";

const transportedWastesResolver: QueryResolvers["transportedWastes"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const isRegistreNational = checkIsRegistreNational(user);

  // bypass authorization if the user authenticated from a service account
  if (!isRegistreNational) {
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
