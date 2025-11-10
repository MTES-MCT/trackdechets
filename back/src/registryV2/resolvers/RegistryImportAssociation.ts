import { prisma } from "@td/prisma";
import type { RegistryImportAssociationResolvers } from "@td/codegen-back";
import {
  type Company,
  type RegistryImportAssociation as PrismaRegistryImportAssociation
} from "@td/prisma";

export const RegistryImportAssociation: Omit<
  RegistryImportAssociationResolvers,
  "reportedFor" | "reportedAs"
> & {
  reportedFor: (parent: PrismaRegistryImportAssociation) => Promise<Company>;
  reportedAs: (parent: PrismaRegistryImportAssociation) => Promise<Company>;
} = {
  reportedFor: async parent => {
    const company = await prisma.company.findUniqueOrThrow({
      where: { siret: parent.reportedFor as string }
    });

    return company;
  },
  reportedAs: async parent => {
    const company = await prisma.company.findUniqueOrThrow({
      where: { siret: parent.reportedAs as string }
    });

    return company;
  }
};
