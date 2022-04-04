import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";
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
    await checkIsCompanyMember({ id: user.id }, { siret });
  }

  return getWasteConnection("ALL", args);
};

export default allWastesResolver;
