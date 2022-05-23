import {
  CompanyVerificationMode,
  CompanyVerificationStatus
} from "@prisma/client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { sendVerificationCodeLetter } from "../../../common/post";
import { MutationResolvers } from "@trackdechets/codegen/src/back.gen";
import prisma from "../../../prisma";
import { getCompanyOrCompanyNotFound } from "../../database";

const sendVerificationCodeLetterResolver: MutationResolvers["sendVerificationCodeLetter"] =
  async (parent, { input: { siret } }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAdmin(context);
    const company = await getCompanyOrCompanyNotFound({ siret });
    await sendVerificationCodeLetter(company);
    const updatedCompany = await prisma.company.update({
      where: { siret: company.siret },
      data: {
        verificationStatus: CompanyVerificationStatus.LETTER_SENT,
        verificationMode: CompanyVerificationMode.LETTER
      }
    });

    return updatedCompany;
  };

export default sendVerificationCodeLetterResolver;
