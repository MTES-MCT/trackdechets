import {
  CompanyVerificationMode,
  CompanyVerificationStatus
} from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { sendMail } from "../../../mailer/mailing";
import { verificationDone } from "../../../mailer/templates";
import { renderMail } from "../../../mailer/templates/renderers";
import prisma from "../../../prisma";
import { checkIsCompanyAdmin } from "../../../users/permissions";
import { convertUrls, getCompanyOrCompanyNotFound } from "../../database";

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
  const company = await getCompanyOrCompanyNotFound({ siret });
  await checkIsCompanyAdmin(user, company);

  if (code !== company.verificationCode) {
    throw new UserInputError("Code de vérification invalide");
  }

  const verifiedCompany = await prisma.company.update({
    where: { siret },
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

  return convertUrls(verifiedCompany);
};

export default verifyCompanyResolver;
