import { Prisma } from "@prisma/client";
import { getPrismaPaginationArgs } from "../../../common/pagination";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { AuthType, applyAuthStrategies } from "../../../auth";
import {
  MIN_MY_COMPANIES_SEARCH,
  MAX_MY_COMPANIES_SEARCH
} from "@td/constants";

import {
  toGqlCompanyPrivate,
  toGqlCompanyPublic
} from "../../../companies/converters";
import { UserInputError } from "../../../common/errors";
import { getRegistryDelegationRepository } from "../../../registryDelegation/repository";
import { getActiveDelegationFilter } from "../../../registryDelegation/resolvers/queries/utils/registryDelegations.utils";

const registryCompaniesResolver: QueryResolvers["registryCompanies"] = async (
  _parent,
  args,
  context
) => {
  const me = checkIsAuthenticated(context);
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);
  const { firstCompanies, firstDelegators, search, userRoles } = args;

  let searchQuery: Prisma.CompanyAssociationWhereInput = {};
  let allCompanyIds: string[] | null = null;
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
    // we need to have all the user's companies ids to use it as a filter on the delegation query
    // if we used companyIds defined below, we wouldn't be able to get all the delegations
    const allAssociations = await prisma.companyAssociation.findMany({
      where: {
        userId: me.id,
        company: { siret: { not: null } }
      },
      select: { companyId: true }
    });
    allCompanyIds = allAssociations.map(a => a.companyId);
  }
  if (userRoles && userRoles.length > 0) {
    searchQuery.role = {
      in: userRoles
    };
  }
  const where = {
    userId: me.id,
    company: { siret: { not: null } },
    ...searchQuery
  };

  // retrieves all companies ids
  const associations = await prisma.companyAssociation.findMany({
    where,
    select: { companyId: true }
  });

  const companyIds = associations.map(a => a.companyId);

  const totalMyCompaniesCount = companyIds.length;

  const myCompaniesRaw = await prisma.company.findMany({
    where: {
      id: { in: companyIds }
    },
    ...getPrismaPaginationArgs({
      first: firstCompanies ?? 10
    }),
    orderBy: [
      {
        givenName: "asc"
      },
      {
        createdAt: "asc"
      }
    ]
  });
  const myCompanies = myCompaniesRaw.map(c => toGqlCompanyPrivate(c));

  // get all delegations that fit the search and have the user's companies as delegate
  const delegationRepository = getRegistryDelegationRepository(me);

  const fixedWhere: Prisma.RegistryDelegationWhereInput = {
    delegate: {
      id: { in: allCompanyIds ?? companyIds }
    },
    ...getActiveDelegationFilter(),
    ...(search
      ? {
          delegator: {
            OR: [
              {
                name: { contains: search!, mode: "insensitive" }
              },
              {
                givenName: { contains: search!, mode: "insensitive" }
              },
              {
                siret: { contains: search!, mode: "insensitive" }
              }
            ]
          }
        }
      : {})
  };

  const allDelegators = await delegationRepository.findMany(fixedWhere, {
    select: {
      id: true,
      delegator: {
        select: {
          id: true
        }
      }
    }
  });
  if (allDelegators.length === 0) {
    return {
      totalCount: totalMyCompaniesCount,
      myCompanies,
      delegators: []
    };
  }
  const delegatorsIds = Array.from(
    new Set(allDelegators.map(d => d.delegator.id))
  );
  const totalDelegatorsCount = delegatorsIds.length;
  // get all delegator companies
  const delegatorsRaw = await prisma.company.findMany({
    where: {
      id: { in: delegatorsIds }
    },
    ...getPrismaPaginationArgs({
      first: firstDelegators ?? 10
    }),
    orderBy: [
      {
        givenName: "asc"
      },
      {
        createdAt: "asc"
      }
    ]
  });
  const delegators = delegatorsRaw.map(c => toGqlCompanyPublic(c));

  return {
    totalCount: totalMyCompaniesCount + totalDelegatorsCount,
    myCompanies,
    delegators
  };
};

export default registryCompaniesResolver;
