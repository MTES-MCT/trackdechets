import { FormResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";

const ecoOrganismeResolver: FormResolvers["ecoOrganisme"] = form => {
  return prisma.form({ id: form.id }).ecoOrganisme();
};

export default ecoOrganismeResolver;
