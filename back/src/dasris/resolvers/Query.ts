import dasris from "./queries/dasris";
import dasri from "./queries/dasri";
import { QueryResolvers } from "../../generated/graphql/types";
const Query: QueryResolvers = {
  dasris,
  dasri
};

export default Query;
