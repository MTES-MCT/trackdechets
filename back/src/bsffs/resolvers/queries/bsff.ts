import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { unflattenBsff } from "../../converter";
import { getUserSirets } from "../../../common/cache";
import { getBsffOrNotFound } from "../../database";

const bsff: QueryResolvers["bsff"] = async (_, { id }, context) => {
  const user = checkIsAuthenticated(context);
  const sirets = await getUserSirets(user.id);
  const bsff = await getBsffOrNotFound({
    id,
    OR: [
      { emitterCompanySiret: { in: sirets } },
      { transporterCompanySiret: { in: sirets } },
      { destinationCompanySiret: { in: sirets } }
    ]
  });

  return unflattenBsff(bsff);
};

export default bsff;
