
import axios from "axios";
import * as request from "request";
import * as util from "util";


export const alertTypes = {
  BSD_CREATION: "CREATION BSD",
  INSCRIPTION: "INSCRIPTION"
};


/*
* Create a Trello card in a specific list using Trello API
* See https://developers.trello.com/reference/#introduction
* and https://developers.trello.com/reference/#cards-2
*/
async function createCard(data) {

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

/*
* Returns all the cards in a specific list
*/
export function getCards(idList) {

  const config = {
    params: {
      key: process.env.TRELLO_API_KEY,
      token: process.env.TRELLO_TOKEN
    }
  };

  const url = `https://api.trello.com/1/lists/${idList}/cards?fields=id,name,labels`;

  return axios.get(url, config)
    .then(response => {
      return response.data;
    });
}

/*
* Attach some files to a specific card
*/
function attachToCard(idCard, file, filename){

  const url = `https://api.trello.com/1/cards/${idCard}/attachments`;

  const formData = {
    key: process.env.TRELLO_API_KEY,
    token: process.env.TRELLO_TOKEN,
    file: {
      value: file,
      options: {
        filename: filename,
      }
    },
    name: filename
  };

  // use request here because axios does not play well with
  // form-data
  const requestPost = util.promisify(request.post);

  return requestPost({url, formData}).then(r => {
    return r.body;
  });
}

const idAlertsList = process.env.TRELLO_ALERTS_LIST_ID;
const notIcpeLabelId = "5d4131f3159c5f75617c81fc";
const notCompatibleLabelId = "5c3c3b13a3a82f48728d9343";
const siretUnknownLabelId = "5d68e9630969b733ef3dc1eb";


export async function createSiretUnknownAlertCard(company, alertType, options=null) {

  options = options || {};

  const cardName = `[${alertType}] ${company.siret}`;

  const cards = await getCards(idAlertsList);

  const foundCard = cards.find(c => {
    return (c.name == cardName) && (c.labels[0].id == siretUnknownLabelId);
  });

  if (foundCard) {
    if (options.bsd) {
      await attachToCard(
        foundCard.id,
        JSON.stringify(options.bsd, null, 2),
        "bsd.json");
    }
    return;
  }

  let description = "";

  if (alertType == alertTypes.BSD_CREATION) {
    description = `Le siret ${company.siret} du destinataire n'a pas été reconnu`;
  }

  if (alertType == alertTypes.INSCRIPTION) {
    description = `Un utilisateur a crée un compte pour l'entreprise ${company.siret}
mais ce siret n'a pas été reconnu`
  }

  const data = {
    name: cardName,
    idLabels: siretUnknownLabelId,
    idList: idAlertsList,
    desc: description
  };

  const created = await createCard(data);

  if (options.bsd) {
   await attachToCard(
     created.id,
     JSON.stringify(options.bsd, null, 2),
     "bsd.json");
  }

  if (options.user) {
    await attachToCard(
      created.id,
      JSON.stringify(options.user, null, 2),
      "user.json");
  }
}

/*
* Create a card labelled "Non ICPE" in list "Alertes"
* of the "Verif prestataire" board
*/
export async function createNotICPEAlertCard(company, alertType, options=null){

  options = options || {};

  const cardName = `[${alertType}] ${company.name} (${company.siret})`;

  // check if an alert already exist for this company
  const cards = await getCards(idAlertsList);

  const foundCard = cards.find(c =>{
    return (c.name == cardName) && (c.labels[0].id == notIcpeLabelId);
  });

  if (foundCard) {
    if (options.bsd) {
      await attachToCard(
        foundCard.id,
        JSON.stringify(options.bsd, null, 2),
        "bsd.json");
    }
    return;
  }

  const desc = `La société ${company.name} n'a pas été retrouvée
dans la base des installations classées pour la protection
de l'environnement

* SIRET: ${company.siret}
* Code NAF: ${company.naf}
* Adresse: ${company.address}
`;

  const data = {
    name: cardName,
    idLabels: notIcpeLabelId,
    idList: idAlertsList,
    desc
  };

  const created = await createCard(data);

  if (options.bsd) {
    await attachToCard(
      created.id, JSON.stringify(created, null, 2), "bsd.json");
  }

  if (options.user) {
    await attachToCard(
      created.id,
      JSON.stringify(options.user, null, 2),
      "user.json");
  }

}

/*
 * Create a card labelled "Incompatible" in list "Alertes"
 * of the "Verif prestataire board"
 */
export async function createNotCompatibleRubriqueAlertCard(company, alertType, bsd){

  const cardName = `[${alertType}] ${company.name} (${company.siret})`;

  // check if an alert already exist for this company
  const cards = await getCards(idAlertsList);

  const foundCard = cards.find(c =>{
    return (c.name == cardName) && (c.labels[0].id == notCompatibleLabelId);
  });

  if (foundCard) {
    await attachToCard(
      foundCard.id,
      JSON.stringify(bsd, null, 2),
      "bsd.json");
    return;
  }

  const desc = `La société ${company.name} est bien une ICPE mais
ses rubriques ne semblent pas être compatible avec le déchet dont le
code est ${bsd.wasteDetailsCode}

* SIRET: ${company.siret}
* Code NAF: ${company.naf}
* Adresse: ${company.address}
* Identifiant s3ic: ${company.codeS3ic}
`;

  const data = {
    name: cardName,
    idLabels: notCompatibleLabelId,
    urlSource: company.urlFiche,
    idList: idAlertsList,
    desc
  };

  const created = await createCard(data);

  await attachToCard(created.id, JSON.stringify(bsd, null, 2), "bsd.json");
}
