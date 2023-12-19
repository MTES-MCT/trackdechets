import { CompanyType, CompanyVerificationStatus } from "@prisma/client";
import { addDays } from "date-fns";
import * as COMPANY_CONSTANTS from "shared/constants";
import { sendVerificationCodeLetter } from "../common/post";
import { prisma } from "@td/prisma";
import { sameDayMidnight } from "../utils";

export const anomalies = {
  NO_ANOMALY: "no_anomaly",
  NOT_ICPE_27XX_35XX: "not_icpe_27XX_35XX",
  RUBRIQUES_INCOMPATIBLE: "rubriques_incompatible",
  SIRET_UNKNOWN: "siret_unkown"
};

// Sends verification letters to all waste professionnal that were not
// verified manually within the allowed timeframe. This functions is typically
// called by a CRON job running every day.
export async function sendVerificationCodeLetters() {
  const today = sameDayMidnight(new Date(Date.now()));
  const verifiableCompanies = await prisma.company.findMany({
    where: {
      // Companies that change their profile from producer only to professional after the
      // allowed timeframe will not be targeted by the query below. Manual action
      // will be needed from the admin interface
      createdAt: { gte: addDays(today, -4), lt: addDays(today, -3) },
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED,
      companyTypes: {
        hasSome: COMPANY_CONSTANTS.PROFESSIONALS as CompanyType[]
      }
    }
  });
  for (const company of verifiableCompanies) {
    await sendVerificationCodeLetter(company);
    await prisma.company.update({
      where: { id: company.id },
      data: { verificationStatus: CompanyVerificationStatus.LETTER_SENT }
    });
  }
}
