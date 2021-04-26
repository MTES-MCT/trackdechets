import bsdasris from "./queries/bsdasris";
import bsdasri from "./queries/bsdasri";
import { QueryResolvers } from "../../generated/graphql/types";
const Query: QueryResolvers = {
  bsdasris,
  bsdasri
};

export default Query;
