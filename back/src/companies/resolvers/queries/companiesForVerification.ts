import { CompanyType, Prisma } from ".prisma/client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { getConnectionsArgs } from "../../../forms/pagination";
import { QueryResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import * as COMPANY_TYPES from "../../../common/constants/COMPANY_TYPES";

const companiesForVerificationResolver: QueryResolvers["companiesForVerification"] = async (
  parent,
  { first, last, skip, where },
  context
) => {
  const connectionArgs = getConnectionsArgs({
    first,
    last,
    skip: skip && skip > 0 ? skip : null
  });

  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);

  const totalCount = await prisma.company.count({ where });

  const companies = await prisma.company.findMany({
    ...connectionArgs,
    where: {
      ...where,
      companyTypes: { hasSome: COMPANY_TYPES.PROFESSIONALS as CompanyType[] }
    },
    orderBy: {
      createdAt: Prisma.SortOrder.desc
    }
  });

  return {
    totalCount,
    companies
  };
};

export default companiesForVerificationResolver;
