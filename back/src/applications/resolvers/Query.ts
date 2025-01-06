import type { QueryResolvers } from "@td/codegen-back";
import myApplications from "./queries/myApplications";
import application from "./queries/application";

export const Query: QueryResolvers = {
  myApplications,
  application
};
