import {
  CompanyVerificationMode,
  CompanyVerificationStatus
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

  // TODO: must do the same in verifyCompanyByAdmin ?
  // If foreign transporter company, send appropriate email
  if (
    isTransporter(verifiedCompany) &&
    isForeignVat(verifiedCompany.vatNumber)
  ) {
    await sendMail(
      renderMail(verifiedForeignTransporterCompany, {
        to: [{ name: user.name, email: user.email }],
        variables: { company: verifiedCompany }
      })
    );
  }

  // TODO: must do the same in verifyCompanyByAdmin ?
  // If the company is professional, send onboarding email
  // (others' onboarding mail is sent on create)
  if (
    [...company.companyTypes].some(ct =>
      COMPANY_CONSTANTS.PROFESSIONALS.includes(ct)
    )
  ) {
    await sendMail(
      renderMail(onboardingFirstStep, {
        to: [{ email: user.email, name: user.name }],
        variables: { company }
      })
    );
  }

  return convertUrls(verifiedCompany);
};

export default verifyCompanyResolver;
