import {
  CompanyVerificationMode,
  CompanyVerificationStatus
} from "@prisma/client";
import { UserInputError } from "apollo-server-core";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { sendVerificationCodeLetter } from "../../../common/post";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { getCompanyOrCompanyNotFound } from "../../database";

const sendVerificationCodeLetterResolver: MutationResolvers["sendVerificationCodeLetter"] =
  async (parent, { input: { siret } }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAdmin(context);
    let company;
    try {
      company = await getCompanyOrCompanyNotFound({ siret });
    } catch (e) {
      throw new UserInputError(
        `SIRET ${siret} introuvable, s'il s'agit d'une entreprise étrangère alors nous ne pouvons donner envoyer la lettre de vérification`
      );
    }
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
