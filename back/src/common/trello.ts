
import axios from "axios";
import * as request from "request";
import * as util from "util";

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
    name: "BSD"
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


export function createSiretUnknownAlertCard(siret, bsd) {

  const cardName = siret;

  getCards(idAlertsList).then(cards => {

    const foundCard = cards.find(c =>{
      return (c.name == cardName) && (c.labels[0].id == siretUnknownLabelId);
    });

    if (foundCard) {
      return attachToCard(foundCard.id, JSON.stringify(bsd, null, 2), "bsd.json");
    }

    const desc = `Le siret ${siret} n'a pas été reconnu`;

    const data = {
      name: cardName,
      idLabels: siretUnknownLabelId,
      idList: idAlertsList,
      desc
    };

    return createCard(data).then(card => {
      return attachToCard(card.id, JSON.stringify(bsd, null, 2), "bsd.json");
    });
  });

}

/*
* Create a card labelled "Non ICPE" in list "Alertes"
* of the "Verif prestataire" board
*/
export function createNotICPEAlertCard(company, bsd){

  const cardName = `${company.name} (${company.siret})`;

  // check if an alert already exist for this company
  getCards(idAlertsList).then(cards => {

    const foundCard = cards.find(c =>{
      return (c.name == cardName) && (c.labels[0].id == notIcpeLabelId);
    });

    if (foundCard) {
      return attachToCard(foundCard.id, JSON.stringify(bsd, null, 2), "bsd.json");
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

    return createCard(data).then(card => {
      return attachToCard(card.id, JSON.stringify(bsd, null, 2), "bsd.json");
    });
  });
}

/*
 * Create a card labelled "Incompatible" in list "Alertes"
 * of the "Verif prestataire board"
 */
export function createNotCompatibleRubriqueAlertCard(company, bsd){

  const cardName = `${company.name} (${company.siret})`;

  // check if an alert already exist for this company
  getCards(idAlertsList).then(cards => {

    const foundCard = cards.find(c =>{
      return (c.name == cardName) && (c.labels[0].id == notCompatibleLabelId);
    });

    if (foundCard) {
      return attachToCard(foundCard.id, JSON.stringify(bsd, null, 2), "bsd.json");
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
    return createCard(data).then(card => {
      return attachToCard(card.id, JSON.stringify(bsd, null, 2), "bsd.json");
    });
  });

}
