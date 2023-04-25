import {
  CompanyVerificationMode,
  CompanyVerificationStatus
} from "@prisma/client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  getCompanyAdminUsers,
  getCompanyOrCompanyNotFound
} from "../../database";
import { sendPostVerificationFirstOnboardingEmail } from "./verifyCompany";

const verifyCompanyByAdminResolver: MutationResolvers["verifyCompanyByAdmin"] =
  async (parent, { input: { siret, verificationComment } }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAdmin(context);
    const company = await getCompanyOrCompanyNotFound({ orgId: siret });

    const verifiedCompany = await prisma.company.update({
      where: { id: company.id },
      data: {
        verificationStatus: CompanyVerificationStatus.VERIFIED,
        verificationMode: CompanyVerificationMode.MANUAL,
        verificationComment,
        verifiedAt: new Date()
      }
    });

    const companyAdmins = await getCompanyAdminUsers(verifiedCompany.orgId);

    await sendPostVerificationFirstOnboardingEmail(
      verifiedCompany,
      companyAdmins[0]
    );

    return verifiedCompany;
  };

export default verifyCompanyByAdminResolver;
