import { Company } from "@prisma/client";
import { getConnection } from "../../../common/pagination";
import { checkIsAuthenticated } from "../../../common/permissions";
import { convertUrls } from "../../../companies/database";
import {
  CompanyPrivate,
  QueryResolvers
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { AuthType } from "../../../auth";
import {
  MIN_MY_COMPANIES_SEARCH,
  MAX_MY_COMPANIES_SEARCH
} from "shared/constants";
import { UserInputError } from "../../../common/errors";
import { libelleFromCodeNaf } from "../../../companies/sirene/utils";

const myCompaniesResolver: QueryResolvers["myCompanies"] = async (
  _parent,
  args,
  context
) => {
  const me = checkIsAuthenticated(context);

  const { search, ...paginationArgs } = args;
  if (!!search && context.user?.auth !== AuthType.Session) {
    throw new UserInputError(
      `Le paramètre de recherche "search" est réservé à usage interne et n'est pas disponible via l'api.`
    );
  }
  let searchQuery = {};

  if (search) {
    if (
      search.length < MIN_MY_COMPANIES_SEARCH ||
      search.length > MAX_MY_COMPANIES_SEARCH
    ) {
      throw new UserInputError(
        `Le paramètre de recherche doit être compris entre ${MIN_MY_COMPANIES_SEARCH} et ${MAX_MY_COMPANIES_SEARCH} caractères.`
      );
    }
    searchQuery = {
      OR: [
        {
          company: { name: { contains: search, mode: "insensitive" } }
        },
        {
          company: { givenName: { contains: search, mode: "insensitive" } }
        },
        {
          company: { siret: { contains: search, mode: "insensitive" } }
        },
        {
          company: { vatNumber: { contains: search, mode: "insensitive" } }
        }
      ]
    };
  }
  const where = { userId: me.id, ...searchQuery };

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
        where: {
          id: { in: companyIds }
        },
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
      const libelleNaf = libelleFromCodeNaf(naf!);
      return { ...companyPrivate, naf, libelleNaf, address };
    },
    ...paginationArgs
  });
};

export default myCompaniesResolver;
