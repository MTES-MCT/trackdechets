import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandBsffFromDB, expandBsffPackagingFromDB } from "../../converter";
import { getBsffPackagingOrNotFound } from "../../database";
import { checkCanRead } from "../../permissions";

const bsffPackaging: QueryResolvers["bsffPackaging"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const bsffPackaging = await getBsffPackagingOrNotFound({
    id
  });

  await checkCanRead(user, bsffPackaging.bsff);

  return {
    ...expandBsffPackagingFromDB(bsffPackaging),
    // the following fields will be resolved in BsffPackagingDetail resolver
    bsff: expandBsffFromDB(bsffPackaging.bsff),
    previousBsffs: [],
    nextBsffs: []
  };
};

export default bsffPackaging;
