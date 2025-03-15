import type { AdminRequestResolvers } from "@td/codegen-back";
import { companyResolver } from "./company";
import { userResolver } from "./user";

const adminRequestResolvers: AdminRequestResolvers = {
  company: companyResolver,
  user: userResolver
};

export default adminRequestResolvers;
