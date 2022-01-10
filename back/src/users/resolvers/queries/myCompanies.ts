import { Company } from "@prisma/client";
import { nafCodes } from "../../../common/constants/NAF";
import { getConnection } from "../../../common/pagination";
import { checkIsAuthenticated } from "../../../common/permissions";
import { convertUrls } from "../../../companies/database";
import {
  CompanyPrivate,
  QueryResolvers
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";

const myCompaniesResolver: QueryResolvers["myCompanies"] = async (
  _parent,
  args,
  context
) => {
  const me = checkIsAuthenticated(context);

  const where = { userId: me.id };

  // retrieves all companies ids
  const associations = await prisma.companyAssociation.findMany({
    where,
    select: { companyId: true }
  });

  const companyIds = associations.map(a => a.companyId);

  const totalCount = companyIds.length;

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.company.findMany({
        where: { id: { in: companyIds } },
        ...prismaPaginationArgs,
        orderBy: [
          {
            givenName: "asc"
          },
          {
            createdAt: "asc"
          }
        ]
      }),
    formatNode: (company: Company) => {
      const companyPrivate: CompanyPrivate = convertUrls(company);
      const { codeNaf: naf, address } = company;
      const libelleNaf = naf in nafCodes ? nafCodes[naf] : "";
      return { ...companyPrivate, naf, libelleNaf, address };
    },
    ...args
  });
};

export default myCompaniesResolver;
