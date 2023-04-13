import {
  Company,
  CompanyVerificationMode,
  CompanyVerificationStatus,
  User
} from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { sendMail } from "../../../mailer/mailing";
import {
  onboardingFirstStep,
  verificationDone,
  verifiedForeignTransporterCompany
} from "../../../mailer/templates";
import { renderMail } from "../../../mailer/templates/renderers";
import prisma from "../../../prisma";
import { checkIsCompanyAdmin } from "../../../users/permissions";
import { convertUrls, getCompanyOrCompanyNotFound } from "../../database";
import { isForeignVat } from "../../../common/constants/companySearchHelpers";
import { isTransporter } from "../../validation";
import * as COMPANY_CONSTANTS from "../../../common/constants/COMPANY_CONSTANTS";

export const sendPostVerificationFirstOnboardingEmail = async (
  company: Company,
  admin: { email: string; name?: string }
) => {
  // If foreign transporter company
  if (isTransporter(company) && isForeignVat(company.vatNumber)) {
    await sendMail(
      renderMail(verifiedForeignTransporterCompany, {
        to: [{ name: admin.name, email: admin.email }],
        variables: { company: company }
      })
    );

    return;
  }

  // If professional company
  if (
    [...company.companyTypes].some(ct =>
      COMPANY_CONSTANTS.PROFESSIONALS.includes(ct)
    )
  ) {
    await sendMail(
      renderMail(onboardingFirstStep, {
        to: [{ email: admin.email, name: admin.name }],
        variables: { company }
      })
    );
  }
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
  await checkIsCompanyAdmin(user, company);

  if (code !== company.verificationCode) {
    throw new UserInputError("Code de vérification invalide");
  }

  const verifiedCompany = await prisma.company.update({
    where: { id: company.id },
    data: {
      verificationStatus: CompanyVerificationStatus.VERIFIED,
      verificationMode: CompanyVerificationMode.LETTER,
      verifiedAt: new Date()
    }
  });

  await sendMail(
    renderMail(verificationDone, {
      to: [{ name: user.name, email: user.email }],
      variables: { company: verifiedCompany }
    })
  );

  // Potential onboarding email
  await sendPostVerificationFirstOnboardingEmail(verifiedCompany, user);

  return convertUrls(verifiedCompany);
};

export default verifyCompanyResolver;
