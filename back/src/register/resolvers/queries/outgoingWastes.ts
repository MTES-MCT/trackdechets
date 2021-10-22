import { QueryResolvers } from "../../../generated/graphql/types";
import getWasteConnection from "../../wastes";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsCompanyMember } from "../../../users/permissions";

const outgoingWastesResolver: QueryResolvers["outgoingWastes"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  // bypass authorization if the user is authenticated from a service account
  if (!user.isService) {
    for (const siret of args.sirets) {
      await checkIsCompanyMember({ id: user.id }, { siret });
    }
  }

  return getWasteConnection("OUTGOING", args);
};

export default outgoingWastesResolver;
