import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { unflattenBsff } from "../../converter";
import { getCachedUserCompanies } from "../../../common/redis/users";
import { getBsffOrNotFound } from "../../database";

const bsff: QueryResolvers["bsff"] = async (_, { id }, context) => {
  const user = checkIsAuthenticated(context);
  const userCompaniesSiretOrVat = await getCachedUserCompanies(user.id);
  const bsff = await getBsffOrNotFound({
    id,
    OR: [
      { emitterCompanySiret: { in: userCompaniesSiretOrVat } },
      { transporterCompanySiret: { in: userCompaniesSiretOrVat } },
      { destinationCompanySiret: { in: userCompaniesSiretOrVat } }
    ]
  });

  return unflattenBsff(bsff);
};

export default bsff;
