import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";
import { checkIsAuthenticated } from "../../../common/permissions";
import { unflattenBsff } from "../../converter";
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

  return unflattenBsff(bsff);
};

export default bsff;
