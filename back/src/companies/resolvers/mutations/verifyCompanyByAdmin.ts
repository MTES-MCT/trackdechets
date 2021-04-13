import {
  CompanyVerificationMode,
  CompanyVerificationStatus
} from "@prisma/client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { getCompanyOrCompanyNotFound } from "../../database";

const verifyCompanyByAdminResolver: MutationResolvers["verifyCompanyByAdmin"] = async (
  parent,
  { input: { siret, verificationComment } },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);
  const company = await getCompanyOrCompanyNotFound({ siret });

  const verifiedCompany = await prisma.company.update({
    where: { siret: company.siret },
    data: {
      verificationStatus: CompanyVerificationStatus.VERIFIED,
      verificationMode: CompanyVerificationMode.MANUAL,
      verificationComment,
      verifiedAt: new Date()
    }
  });

  return verifiedCompany;
};

export default verifyCompanyByAdminResolver;
