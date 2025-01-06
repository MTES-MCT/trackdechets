import { prisma } from "@td/prisma";
import type { RegistryImportAssociationResolvers } from "@td/codegen-back";

export const RegistryImportAssociation: RegistryImportAssociationResolvers = {
  reportedFor: async parent => {
    const company = await prisma.company.findUniqueOrThrow({
      where: { siret: parent.reportedFor as string }
    });

    return {
      siret: company.orgId,
      name: company.givenName ?? company.name
    };
  },
  reportedAs: async parent => {
    const company = await prisma.company.findUniqueOrThrow({
      where: { siret: parent.reportedAs as string }
    });

    return {
      siret: company.orgId,
      name: company.givenName ?? company.name
    };
  }
};
