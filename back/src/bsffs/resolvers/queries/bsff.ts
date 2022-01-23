import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandBsffFromDb } from "../../converter";
import { getCachedUserSirets } from "../../../common/redis/users";
import { getBsffOrNotFound } from "../../database";

const bsff: QueryResolvers["bsff"] = async (_, { id }, context) => {
  const user = checkIsAuthenticated(context);
  const sirets = await getCachedUserSirets(user.id);
  const bsff = await getBsffOrNotFound({
    id,
    OR: [
      { emitterCompanySiret: { in: sirets } },
      { transporterCompanySiret: { in: sirets } },
      { destinationCompanySiret: { in: sirets } }
    ]
  });

  return expandBsffFromDb(bsff);
};

export default bsff;
