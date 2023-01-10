import { QueryResolvers } from "../../../generated/graphql/types";
import getWasteConnection from "../../wastes";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsCompanyMember } from "../../../users/permissions";

const allWastesResolver: QueryResolvers["allWastes"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  for (const siret of args.sirets) {
    await checkIsCompanyMember({ id: user.id }, { orgId: siret });
  }

  return getWasteConnection("ALL", args);
};

export default allWastesResolver;
