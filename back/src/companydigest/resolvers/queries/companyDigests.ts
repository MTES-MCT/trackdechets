import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";

import { QueryResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth";

import { UserInputError } from "../../../common/errors";
import { getUserRoles } from "../../../permissions";
import { format } from "date-fns";
import { prisma } from "@td/prisma";

const companyDigestResolver: QueryResolvers["companyDigests"] = async (
  _,
  args,
  context: GraphQLContext
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const { orgId } = args;

  const roles = await getUserRoles(user.id);
  const companies = Object.keys(roles);
  if (!companies.includes(orgId)) {
    throw new UserInputError(
      "Vous ne pouvez requêter un établissement dont vous n'êtes pas membre."
    );
  }
  const today = format(new Date(), "yyyy-MM-dd");

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const currentYearCompanyDigest = await prisma.companyDigest.findFirst({
    where: { orgId, year: currentYear, createdAt: { gte: new Date(today) } },
    orderBy: {
      createdAt: "desc"
    }
  });
  const lastYearCompanyDigest = await prisma.companyDigest.findFirst({
    where: { orgId, year: lastYear, createdAt: { gte: new Date(today) } },
    orderBy: {
      createdAt: "desc"
    }
  });

  return [currentYearCompanyDigest, lastYearCompanyDigest].filter(Boolean);
};

export default companyDigestResolver;
