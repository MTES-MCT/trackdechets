import Query from "./Query";
import Mutation from "./Mutation";
import { ResolversTypes } from "../../generated/graphql/types";

const resolvers: Partial<ResolversTypes> = {
  Query,
  Mutation
};

export default resolvers;
