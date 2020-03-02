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

export function searchCompanies(clue: string, department: string = "") {
  return axios
    .get(`${INSEE_URI}/search?clue=${clue}&department=${department}`)
    .then(r => r.data)
    .catch(_ => []); // Silently fail
}
