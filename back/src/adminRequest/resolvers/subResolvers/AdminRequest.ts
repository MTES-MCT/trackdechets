import type { AdminRequestResolvers } from "@td/codegen-back";
import { companyResolver } from "./company";

const adminRequestResolvers: AdminRequestResolvers = {
  company: companyResolver
};

export default adminRequestResolvers;
