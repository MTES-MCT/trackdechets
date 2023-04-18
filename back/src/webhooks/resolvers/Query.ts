import webhooksettings from "./queries/webhooksettings";
import webhooksetting from "./queries/webhooksetting";

import { QueryResolvers } from "../../generated/graphql/types";
const Query: QueryResolvers = {
  webhooksettings,
  webhooksetting
};

export default Query;
