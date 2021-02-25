import { QueryResolvers } from "../../generated/graphql/types";
import bsds from "./queries/bsds";

const Query: QueryResolvers = {
  bsds
};

export default { Query };
