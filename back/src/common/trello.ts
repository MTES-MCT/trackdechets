
import axios from "axios";

/*
* Create a Trello card in a specific list using Trello API
* See https://developers.trello.com/reference/#introduction
* and https://developers.trello.com/reference/#cards-2
*/
function createCard(data) {

  // TODO this is using Benoit Guigal's API key
  // It would be better to get the API key from a
  // Trackdéchet Trello account
  const config = {
    params: {
      key: process.env.TRELLO_API_KEY,
      token: process.env.TRELLO_TOKEN
    }
  };

  return axios.post("https://api.trello.com/1/cards", data, config)
    .then(response => {
      return response.data;
    });
}


const idAlertsList = "5d4051e00cbae2844e2565fc";

/*
* Create a card labelled "Non ICPE" in list "Alertes"
* of the "Verif prestataire" board
*/
export function createNotICPEAlertCard(company, bsd){
  const desc = `La société ${company.name} n'a pas été retrouvée
dans la base des installations classées pour la protection
de l'environnement

* SIRET: ${company.siret}
* Code NAF: ${company.naf}
* Adresse: ${company.address}

\`\`\`
${JSON.stringify(bsd, null, 2)}
\`\`\`
`;

  const notIcpeLabelId = "5d4131f3159c5f75617c81fc";

  const data = {
    name: `${company.name}`,
    idLabels: notIcpeLabelId,
    idList: idAlertsList,
    desc
  };

  return createCard(data);
}

/*
 * Create a card labelled "Incompatible" in list "Alertes"
 * of the "Verif prestataire board"
 */
export function createNotCompatibleRubriqueAlertCard(company, bsd){

  const desc = `La société ${company.name} est bien une ICPE mais
ses rubriques ne semblent pas être compatible avec le déchet dont le
code est ${bsd.wasteDetailsCode}

* SIRET: ${company.siret}
* Code NAF: ${company.naf}
* Adresse: ${company.address}
* Identifiant s3ic: ${company.codeS3ic}

\`\`\`
${JSON.stringify(bsd, null, 2)}
\`\`\`
`;

  const notCompatibleLabelId = "5c3c3b13a3a82f48728d9343";

  const data = {
    name: `${company.name}`,
    idLabels: notCompatibleLabelId,
    urlSource: company.urlFiche,
    idList: idAlertsList,
    desc
  };
  return createCard(data);
}
