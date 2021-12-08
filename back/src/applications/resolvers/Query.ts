import { QueryResolvers } from "../../generated/graphql/types";
import applications from "./queries/applications";
import application from "./queries/application";

export const Query: QueryResolvers = {
  applications,
  application
};
