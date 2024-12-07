import { CompanyVerificationStatus } from "@prisma/client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { getCompanyOrCompanyNotFound } from "../../database";

const standbyCompanyByAdminResolver: MutationResolvers["standbyCompanyByAdmin"] =
  async (parent, { input: { orgId, standby } }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAdmin(context);

    const company = await getCompanyOrCompanyNotFound({ orgId });

    const verifiedCompany = await prisma.company.update({
      where: { id: company.id },
      data: {
        verificationStatus: standby
          ? CompanyVerificationStatus.STANDBY
          : CompanyVerificationStatus.TO_BE_VERIFIED
      }
    });

    return verifiedCompany;
  };

export default standbyCompanyByAdminResolver;
