import { CompanyType, Prisma } from "@prisma/client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import * as COMPANY_TYPES from "../../../common/constants/COMPANY_TYPES";
import { getPrismaPaginationArgs } from "../../../common/pagination";

const companiesForVerificationResolver: QueryResolvers["companiesForVerification"] =
  async (parent, { first, last, skip, where }, context) => {
    const paginationArgs = getPrismaPaginationArgs({
      first,
      last,
      skip
    });

    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAdmin(context);

    const whereInput = {
      ...where,
      companyTypes: { hasSome: COMPANY_TYPES.PROFESSIONALS as CompanyType[] }
    };

    const totalCount = await prisma.company.count({ where: whereInput });

    const companies = await prisma.company.findMany({
      ...paginationArgs,
      where: whereInput,
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
