import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";
import myApplications from "./queries/myApplications";
import application from "./queries/application";

export const Query: QueryResolvers = {
  myApplications,
  application
};
