import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandBsffFromDB, expandBsffPackagingFromDB } from "../../converter";
import { getCachedUserSiretOrVat } from "../../../common/redis/users";
import { getBsffPackagingOrNotFound } from "../../database";

const bsffPackaging: QueryResolvers["bsffPackaging"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  const bsffPackaging = await getBsffPackagingOrNotFound({
    id,
    bsff: {
      OR: [
        { emitterCompanySiret: { in: userCompaniesSiretOrVat } },
        { transporterCompanySiret: { in: userCompaniesSiretOrVat } },
        { destinationCompanySiret: { in: userCompaniesSiretOrVat } }
      ]
    }
  });

  return {
    ...expandBsffPackagingFromDB(bsffPackaging),
    // the following fields will be resolved in BsffPackagingDetail resolver
    bsff: expandBsffFromDB(bsffPackaging.bsff),
    previousBsffs: [],
    nextBsffs: []
  };
};

export default bsffPackaging;
