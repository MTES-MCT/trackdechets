import { MutationResolvers } from "../../generated/graphql/types";
import createApplication from "./mutations/createApplication";

export const Mutation: MutationResolvers = {
  createApplication
};
