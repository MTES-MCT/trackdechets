import axios from "axios";
import { cachedGet } from "../common/redis";
import { UserInputError } from "apollo-server-express";

export const COMPANY_INFOS_CACHE_KEY = "CompanyInfos";
const INSEE_URI = "http://td-insee:81";
const EXPIRY_TIME = 60 * 60 * 24;

function getCompanySireneInfo(siret: string) {
  return axios.get(`${INSEE_URI}/siret/${siret}`).then(v => v.data);
}

export function getCachedCompanySireneInfo(siret) {
  if (siret.length !== 14) {
    throw new UserInputError("Le siret doit faire 14 caractères", {
      invalidArgs: ["siret"]
    });
  }

  return cachedGet(getCompanySireneInfo, COMPANY_INFOS_CACHE_KEY, siret, {
    parser: JSON,
    options: { EX: EXPIRY_TIME }
  }).catch(_ => {
    throw new Error("Erreur technique, merci de réessayer");
  });
}

const SIRENE_API_BASE_URL = "https://entreprise.data.gouv.fr/api/sirene";

export function searchCompanies(clue: string, department?: string) {
  // API v1 is still used here because v3 does not support
  // full text. It is marked as DEPRECATED but the team in
  // #entreprise-data-gouv will still support it until
  // v3 includes full text. The Solr index of the v1 is still
  // updated with new data
  let searchUrl = `${SIRENE_API_BASE_URL}/v1/full_text/${clue}`;

  if (department && department.length === 2) {
    searchUrl = `${searchUrl}?departement=${department}`;
  }

  if (department && department.length === 2) {
    // this migth actually be a postal code
    searchUrl = `${searchUrl}?code_postal=${department}`;
  }

  return axios.get(searchUrl).then(r => {
    return r.data.etablissement;
  });
}
