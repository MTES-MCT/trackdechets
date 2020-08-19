import { QueryResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";

const ecoOrganismeResolver: QueryResolvers["ecoOrganismes"] = () => {
  return prisma.ecoOrganismes();
};

export default ecoOrganismeResolver;
