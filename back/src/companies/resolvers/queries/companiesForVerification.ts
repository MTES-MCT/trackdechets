import { CompanyType, Prisma } from "@prisma/client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import type { QueryResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import * as COMPANY_CONSTANTS from "@td/constants";
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
      companyTypes: {
        hasSome: COMPANY_CONSTANTS.PROFESSIONALS as CompanyType[]
      }
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
