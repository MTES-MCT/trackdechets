import { prisma } from "@td/prisma";
import { QueryResolvers } from "@td/codegen-back";

const ecoOrganismeResolver: QueryResolvers["ecoOrganismes"] = () => {
  return prisma.ecoOrganisme.findMany();
};

export default ecoOrganismeResolver;
