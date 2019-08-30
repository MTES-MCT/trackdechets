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
    return [siret, anomalies.SIRET_UNKNOWN];
  }

  if (!company.s3ic) {
    if (!etsDecla[siret]) {
      return [company, anomalies.NOT_ICPE_27XX_35XX];
    }
    // update company rubriques from declaration
    company.rubriques = etsDecla[siret].rubriques;
    company.urlFiche = etsDecla[siret].url_declaration;
  }

  if (wasteCode) {
    const isCompatible = checkIsCompatible(company.rubriques, wasteCode);
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
export function checkIsCompatible(rubriques, wasteCode) {

  // just check for dangerosity compatibility for time being

  const rubriquesDangereousWaste = [
    // Collecte de déchets apportés par le producteur
    ["2710", "1a"],
    ["2710", "1b"],
    // Transit, tri, regroupement, tri ou préparation de
    // déchets d'équipements électriques ou électroniques
    ["2711", "2"],
    // Stockage, dépollution, démontage, découpage ou broyage
    // de véhicules hors d'usages
    ["2712", "1"],
    ["2712", "2"],
    ["2712", "3a"],
    ["2712", "3b"],
    // Transit, regroupement ou tri de déchet dangereux
    ["2718", "1"],
    ["2718", "2"],
    // Installation temporaire de transit de déchets issus de pollutions
    // accidentelles marines ou fluviales ou de catastrophes naturelles
    ["2719", ""],
    // tockage de déchets résultant de la prospection, de l’extraction,
    // du traitement et du stockage de ressources minéralesainsi que
    // de l’exploitation de carrières
    ["2720", "1"],
    // Stockage de déchets autres que ceux mentionnés à la rubrique 2720
    ["2760", "1"],
    ["2760", "4"],
    // Traitement thermique de déchets dangereux
    ["2770", ""],
    // Traitement de déchets dangereux
    ["2790", ""],
    // Traitement de déchets contenant des PCB
    ["2792", "1a"],
    ["2792", "1b"],
    ["2792", "2"],
    // Traitement de déchets d’explosifs
    ["2793", "1a"],
    ["2793", "1b"],
    ["2793", "1c"],
    ["2793", "2a"],
    ["2793", "2b"],
    ["2793", "3a"],
    ["2793", "3b"],
    // Lavage de fûts, conteneurs et citernes de transport
    // de matières alimentaires, de matières dangereuses ou de déchets dangereux
    ["2795", "1"],
    ["2795", "2"],
    // Gestion des déchets radioactifs
    ["2797", "1"],
    ["2797", "2"],
    // Installation temporaire de transit de déchets radioactifs
    ["2798", ""],
    // Traitement de déchets dangereux
    ["3510", ""],
    // Incinération ou coincinération de déchets
    ["3520", "b"],
    // Installation de stockage de déchets
    ["3540", ""],
    // Stockage temporaire de déchets
    ["3550", ""],
    // Stockage souterrain de déchets dangereux
    ["3560", ""]
  ];


  if (isDangerous(wasteCode)) {
    // this is a dangerous waste

    let canTakeDangerousWaste = false;

    for (let rubrique of rubriques) {
      for (let r of rubriquesDangereousWaste) {
        if (r[0] == rubrique.rubrique && r[1] == rubrique.alinea.trim()){
          canTakeDangerousWaste = true;
          break;
        }
      }
    }
    return canTakeDangerousWaste;
  }

  // this is not a dangerous waste, assume any ICPE can take it
  return true;
}