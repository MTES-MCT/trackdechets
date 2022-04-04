import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";
import getWasteConnection from "../../wastes";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsCompanyMember } from "../../../users/permissions";

const transportedWastesResolver: QueryResolvers["transportedWastes"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  // bypass authorization if the user authenticated from a service account
  if (!user.isRegistreNational) {
    for (const siret of args.sirets) {
      await checkIsCompanyMember({ id: user.id }, { siret });
    }
  }

  return getWasteConnection("TRANSPORTED", args);
};

export default transportedWastesResolver;
