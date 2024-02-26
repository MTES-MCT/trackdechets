import { Prisma } from "@prisma/client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { getPrismaPaginationArgs } from "../../../common/pagination";

export const anonymousCompanyRequestsResolver: QueryResolvers["anonymousCompanyRequests"] =
  async (_, { first, last, skip }, context) => {
    const paginationArgs = getPrismaPaginationArgs({
      first,
      last,
      skip
    });

    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAdmin(context);

    const totalCount = await prisma.anonymousCompanyRequest.count();

    const anonymousCompanyRequests =
      await prisma.anonymousCompanyRequest.findMany({
        ...paginationArgs,
        orderBy: {
          createdAt: Prisma.SortOrder.desc
        },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      });

    return {
      totalCount,
      anonymousCompanyRequests
    };
  };

export default anonymousCompanyRequestsResolver;
