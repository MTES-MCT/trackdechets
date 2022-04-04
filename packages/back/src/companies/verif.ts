import { CompanyType, CompanyVerificationStatus } from "@prisma/client";
import axios from "axios";
import { addDays } from "date-fns";
import * as COMPANY_TYPES from "../common/constants/COMPANY_TYPES";
import { sendVerificationCodeLetter } from "../common/post";
import prisma from "../prisma";
import { sameDayMidnight } from "../utils";
import { getInstallation, getRubriques } from "./database";
import { searchCompany } from "./search";

export const anomalies = {
  NO_ANOMALY: "no_anomaly",
  NOT_ICPE_27XX_35XX: "not_icpe_27XX_35XX",
  RUBRIQUES_INCOMPATIBLE: "rubriques_incompatible",
  SIRET_UNKNOWN: "siret_unkown"
};

/**
 * Perform some verifications on a company and return
 * anomalies if any.
 * If a wasteCode is present, compatibility check between
 * the company rubriques and the type of waste is performed
 */
export async function verifyPrestataire(siret, wasteCode = null) {
  // Liste d'ICPE au régime déclaratif mis à jour à la main
  // à partir des sites des préfectures.

  let company = null;

  try {
    company = await searchCompany(siret);
  } catch (err) {
    // siret does not exist
    return [{ siret }, anomalies.SIRET_UNKNOWN];
  }

  // retrieves etablissements with "régime déclaratif"
  const declaUrl =
    "https://trackdechets.fra1.digitaloceanspaces.com/declarations.json";

  let etsDecla = {};

  try {
    const r = await axios.get<{ etablissements: any[] }>(declaUrl);
    // Dict of etablissements keyed by numero siret
    etsDecla = r.data.etablissements;
  } catch (err) {
    // pass
  }

  const installation = await getInstallation(siret);

  if (!installation) {
    if (!etsDecla[siret]) {
      return [company, anomalies.NOT_ICPE_27XX_35XX];
    }
  }

  if (wasteCode) {
    const isCompatible = await checkIsCompatible(installation, wasteCode);
    if (!isCompatible) {
      return [company, anomalies.RUBRIQUES_INCOMPATIBLE];
    }
  }
  return [company, anomalies.NO_ANOMALY];
}

function isDangerous(wasteCode) {
  return wasteCode.includes("*");
}

/*
 * Check if a company's rubriques are compatible with
 * a specific waste code
 */
export async function checkIsCompatible(installation, wasteCode) {
  // just check for dangerosity compatibility for time being

  if (isDangerous(wasteCode)) {
    // this is a dangerous waste

    let canTakeDangerousWaste = false;

    const rubriques = await getRubriques(installation.codeS3ic);

    for (const rubrique of rubriques) {
      if (rubrique.wasteType === "DANGEROUS") {
        canTakeDangerousWaste = true;
        break;
      }
    }
    return canTakeDangerousWaste;
  }

  // this is not a dangerous waste, assume any ICPE can take it
  return true;
}

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
        hasSome: COMPANY_TYPES.PROFESSIONALS as CompanyType[]
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
