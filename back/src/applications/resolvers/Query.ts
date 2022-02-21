import { QueryResolvers } from "../../generated/graphql/types";
import myApplications from "./queries/myApplications";
import application from "./queries/application";

export const Query: QueryResolvers = {
  myApplications,
  application
};
