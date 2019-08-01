
import {createNotICPEAlertCard, createNotCompatibleRubriqueAlertCard} from "../common/trello";

/*
* Check if a company's rubriques are compatible with
* a specific waste code
*/
export function checkIsCompatible(company, wasteCode) {

  // just check for dangerosity compatibility for time being

  const rubriquesDangereousWaste = [
    '2718', // Transit, regroupement ou tri de déchet dangereux
    '2770', // Traitement thermique de déchets dangereux
    '2790', // Traitement de déchets dangereux
    '3510', // Traitement de déchets dangereux
    '3560', // Stockage souterrain de déchets dangereux
  ]


  if (wasteCode.includes("*")) {
    // this is a dangerous waste

    let canTakeDangerousWaste = false;

    for (let rubrique of company.rubriques) {
      if (rubriquesDangereousWaste.includes(rubrique.rubrique)) {
        canTakeDangerousWaste = true;
        break;
      }
    }

    return canTakeDangerousWaste;
  }

  // this is not a dangerous waste, assume any ICPE can take it
  return true;
}


/*
* Raise an internal alert => a producer is sending a waste
* to a company that is not ICPE
*/
export function notICPEAlert(company, bsd) {
  createNotICPEAlertCard(company, bsd);
}

/*
* Raise an internal alert => a producer is sending a waste
* to a company that is not compatible with this type of waste
*/
export function rubriqueNotCompatibleAlert(company, bsd) {
  createNotCompatibleRubriqueAlertCard(company, bsd)
}