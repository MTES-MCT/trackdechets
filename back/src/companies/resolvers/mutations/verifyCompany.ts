import {
  Company,
  CompanyType,
  CompanyVerificationMode,
  CompanyVerificationStatus
} from "@prisma/client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { sendMail } from "../../../mailer/mailing";
import {
  renderMail,
  onboardingFirstStep,
  verificationDone,
  verifiedForeignTransporterCompany
} from "@td/mail";
import { prisma } from "@td/prisma";
import { getCompanyOrCompanyNotFound } from "../../database";
import { isForeignTransporter } from "../../validation";
import { Permission, checkUserPermissions } from "../../../permissions";
import {
  NotCompanyAdminErrorMsg,
  UserInputError
} from "../../../common/errors";
import { toGqlCompanyPrivate } from "../../converters";

export const sendFirstOnboardingEmail = async (
  {
    companyTypes,
    vatNumber
  }: {
    companyTypes: CompanyType[];
    vatNumber?: string | null;
  },
  admin: { email: string; name?: string | null }
) => {
  if (isForeignTransporter({ companyTypes, vatNumber })) {
    await sendMail(
      renderMail(verifiedForeignTransporterCompany, {
        to: [{ name: admin.name ?? "", email: admin.email }]
      })
    );

    return;
  }

  await sendMail(
    renderMail(onboardingFirstStep, {
      to: [{ email: admin.email, name: admin.name ?? "" }]
    })
  );
};

/**
 * Verify a company from a verification code sent in a letter
 */
const verifyCompanyResolver: MutationResolvers["verifyCompany"] = async (
  parent,
  { input: { code, siret } },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ orgId: siret });

  await checkUserPermissions(
    user,
    company.orgId,
    Permission.CompanyCanVerify,
    NotCompanyAdminErrorMsg(company.orgId)
  );

  if (code !== company.verificationCode) {
    throw new UserInputError("Code de vérification invalide");
  }

  const verifiedCompany = (await prisma.company.update({
    where: { id: company.id },
    data: {
      verificationStatus: CompanyVerificationStatus.VERIFIED,
      verificationMode: CompanyVerificationMode.LETTER,
      verifiedAt: new Date()
    }
  })) as Company & {
    verificationMode: CompanyVerificationMode;
  };

  await sendMail(
    renderMail(verificationDone, {
      to: [{ name: user.name, email: user.email }],
      variables: { company: verifiedCompany }
    })
  );

  // Potential onboarding email
  await sendFirstOnboardingEmail(verifiedCompany, user);

  return toGqlCompanyPrivate(verifiedCompany);
};

export default verifyCompanyResolver;
