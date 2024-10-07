import { libelleFromCodeNaf } from "../../companies/sirene/utils";
import { UserResolvers, CompanyPrivate } from "../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { toGqlCompanyPrivate } from "../../companies/converters";

const userResolvers: UserResolvers = {
  // Returns the list of companies a user belongs to
  // Information from TD and s3ic are merged in a separate resolver (CompanyPrivate.installation)
  // to make up an instance of CompanyPrivate
  companies: async parent => {
    const companyAssociations = await prisma.companyAssociation.findMany({
      where: { userId: parent.id },
      include: { company: true }
    });
    const companies = companyAssociations.map(association => ({
      ...association.company,
      userRole: association.role
    }));

    return companies.map(async company => {
      const companyPrivate: CompanyPrivate = toGqlCompanyPrivate(company);

      const { codeNaf: naf, address } = company;
      const libelleNaf = libelleFromCodeNaf(naf!);

      return { ...companyPrivate, naf, libelleNaf, address };
    });
  },
  featureFlags: async ({ id }) => {
    const featureFlags = await prisma.user
      .findUnique({ where: { id } })
      .featureFlags({ where: { enabled: true } });

    return featureFlags?.map(ff => ff.name) ?? [];
  }
};

export default userResolvers;
