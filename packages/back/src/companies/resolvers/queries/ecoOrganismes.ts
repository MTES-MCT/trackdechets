import prisma from "../../../prisma";
import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";

const ecoOrganismeResolver: QueryResolvers["ecoOrganismes"] = () => {
  return prisma.ecoOrganisme.findMany();
};

export default ecoOrganismeResolver;
