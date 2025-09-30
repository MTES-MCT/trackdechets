import { CompanyVerificationStatus } from "@td/prisma";
import { sendVerificationCodeLetter } from "../../common/post";
import * as COMPANY_CONSTANTS from "@td/constants";
import { prisma } from "@td/prisma";
import { CompanyType } from "@td/prisma";

const { VERIFY_COMPANY } = process.env;

export default async function sendVerificationCodeLetters() {
  if (VERIFY_COMPANY === "true") {
    const companies = await prisma.company.findMany({
      where: {
        verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED,
        companyTypes: {
          hasSome: COMPANY_CONSTANTS.PROFESSIONALS as CompanyType[]
        }
      }
    });

    for (const company of companies) {
      try {
        await sendVerificationCodeLetter(company);
        await prisma.company.update({
          data: { verificationStatus: CompanyVerificationStatus.LETTER_SENT },
          where: { id: company.id }
        });
        console.log(`Successfully sent letter to company ${company.siret}`);
      } catch (_) {
        console.log(
          `Error sending verification code letter to company ${company.siret}`
        );
      }
    }
  } else {
    console.log("Company verification is disabled, skipping script...");
  }
}
