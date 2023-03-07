import { QueryResolvers } from "../../../generated/graphql/types";
import getWasteConnection from "../../wastes";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsCompanyMember } from "../../../users/permissions";
import { checkIsRegistreNational } from "../../permissions";

const managedWastesResolver: QueryResolvers["managedWastes"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const isRegistreNational = checkIsRegistreNational(user);

  // bypass authorization if the user is authenticated from a service account
  if (!isRegistreNational) {
    for (const siret of args.sirets) {
      await checkIsCompanyMember({ id: user.id }, { orgId: siret });
    }
  }

  return getWasteConnection("MANAGED", args);
};

export default managedWastesResolver;
