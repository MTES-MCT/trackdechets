import webhooksettings from "./queries/webhooksettings";
import webhooksetting from "./queries/webhooksetting";

import type { QueryResolvers } from "@td/codegen-back";
const Query: QueryResolvers = {
  webhooksettings,
  webhooksetting
};

export default Query;
