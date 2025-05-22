import type {
  MutationCreateCompanyDigestArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { UserInputError } from "../../../common/errors";
import { getUserRoles } from "../../../permissions";
import { format } from "date-fns";
import { prisma } from "@td/prisma";
import { sendGericoApiRequest } from "../../../queue/producers/gerico";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { CompanyDigestStatus } from "@prisma/client";

const createCompanyDigestResolver = async (
  _: ResolversParentTypes["Mutation"],
  args: MutationCreateCompanyDigestArgs,
  context: GraphQLContext
) => {
  applyAuthStrategies(context, [AuthType.Session]);

  const user = checkIsAuthenticated(context);
  const { input } = args;
  const { orgId, year } = input;
  const roles = await getUserRoles(user.id);
  const companies = Object.keys(roles);
  if (!companies.includes(orgId)) {
    throw new UserInputError(
      "Vous ne pouvez générer une fiche établissement que pour les établissements auxquels vous appartenez."
    );
  }
  const today = format(new Date(), "yyyy-MM-dd");
  const currentYear = new Date().getFullYear();
  const allowedYears = [currentYear - 1, currentYear];
  if (!allowedYears.includes(year)) {
    throw new UserInputError(
      "Vous ne pouvez générer une fiche établissement que pour l'année en cours et l'année précédente."
    );
  }

  const alreadyExists = await prisma.companyDigest.count({
    where: {
      orgId,
      year,
      createdAt: { gte: new Date(today) },
      state: { not: CompanyDigestStatus.ERROR }
    }
  });

  if (alreadyExists) {
    throw new UserInputError(
      "Une fiche établissement a déjà été créée aujourd'hui"
    );
  }

  const companyDigest = await prisma.companyDigest.create({
    data: {
      orgId,
      year,
      userId: user.id
    }
  });
  sendGericoApiRequest(companyDigest.id);
  return companyDigest;
};

export default createCompanyDigestResolver;
