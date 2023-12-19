import { prisma } from "@td/prisma";
import { QueryResolvers } from "../../../generated/graphql/types";

const ecoOrganismeResolver: QueryResolvers["ecoOrganismes"] = () => {
  return prisma.ecoOrganisme.findMany();
};

export default ecoOrganismeResolver;
