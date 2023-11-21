import { convertUrls } from "../../companies/database";
import {
  UserResolvers,
  CompanyPrivate,
  UserRole
} from "../../generated/graphql/types";
import { nafCodes } from "shared/constants";
import prisma from "../../prisma";

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
      userRole: association.role as UserRole
    }));

    return companies.map(async company => {
      const companyPrivate: CompanyPrivate = convertUrls(company);

      const { codeNaf: naf, address } = company;
      const libelleNaf = naf && naf in nafCodes ? nafCodes[naf] : "";

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
