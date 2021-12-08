import { MutationResolvers } from "../../generated/graphql/types";
import createApplication from "./mutations/createApplication";
import updateApplication from "./mutations/updateApplication";
import deleteApplication from "./mutations/deleteApplication";

export const Mutation: MutationResolvers = {
  createApplication,
  updateApplication,
  deleteApplication
};
