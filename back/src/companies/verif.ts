import axios from "axios";
import { getInstallation, getRubriques } from "./queries";
import { searchCompany } from "./sirene";

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
