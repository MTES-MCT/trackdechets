import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandBsffFromDB } from "../../converter";
import { getBsffOrNotFound } from "../../database";
import { checkCanRead } from "../../permissions";

const bsff: QueryResolvers["bsff"] = async (_, { id }, context) => {
  const user = checkIsAuthenticated(context);
  const bsff = await getBsffOrNotFound({
    id
  });
  await checkCanRead(user, bsff);
  return expandBsffFromDB(bsff);
};

export default bsff;
