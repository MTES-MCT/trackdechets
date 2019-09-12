import axios from "axios";

export const anomalies = {
  NO_ANOMALY: "no_anomaly",
  NOT_ICPE_27XX_35XX: "not_icpe_27XX_35XX",
  RUBRIQUES_INCOMPATIBLE: "rubriques_incompatible",
  SIRET_UNKNOWN: "siret_unkown"
}


/**
 * Perform some verifications on a company and return
 * anomalies if any.
 * If a wasteCode is present, compatibility check between
 * the company rubriques and the type of waste is performed
 */
export async function verifyPrestataire(siret, wasteCode = null) {

  // Liste d'ICPE au régime déclaratif mis à jour à la main
  // à partir des sites des préfectures.
  const declaUrl = "https://trackdechets.fra1.digitaloceanspaces.com/declarations.json"

  // Dict of etablissements keyed by numero siret
  const inseeUrl = `http://td-insee:81/siret/${siret}`

  const [r1, r2] = await Promise.all([
    axios.get(declaUrl),
    axios.get(inseeUrl)
  ]);

  const etsDecla = r1.data.etablissements;
  const company = r2.data;

  if (!company.siret) {
    return [{siret}, anomalies.SIRET_UNKNOWN];
  }

  if (!company.codeS3ic) {
    if (!etsDecla[siret]) {
      return [company, anomalies.NOT_ICPE_27XX_35XX];
    }
    // update company rubriques from declaration
    company.rubriques = etsDecla[siret].rubriques;
    company.urlFiche = etsDecla[siret].url_declaration;
  }

  if (wasteCode) {
    const isCompatible = checkIsCompatible(company, wasteCode);
    if (!isCompatible){
      return [company, anomalies.RUBRIQUES_INCOMPATIBLE];
    }
  }
  return [company, anomalies.NO_ANOMALY];
}


function isDangerous(wasteCode) {
  return wasteCode.includes("*")
}


/*
* Check if a company's rubriques are compatible with
* a specific waste code
*/
export function checkIsCompatible(company, wasteCode) {

  // just check for dangerosity compatibility for time being

  if (isDangerous(wasteCode)) {
    // this is a dangerous waste

    let canTakeDangerousWaste = false;

    for (let rubrique of company.rubriques) {
      if (rubrique.waste_type == "DANGEROUS") {
        canTakeDangerousWaste = true;
        break;
      }
    }
    return canTakeDangerousWaste;
  }

  // this is not a dangerous waste, assume any ICPE can take it
  return true;
}