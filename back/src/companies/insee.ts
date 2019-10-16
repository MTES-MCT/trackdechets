import axios from "axios";
import { cachedGet } from "../common/redis";

const COMPANY_INFOS_CACHE_KEY = "CompanyInfos";
const INSEE_URI = "http://td-insee:81";

function getCompanyInfos(siret: string) {
  return axios.get(`${INSEE_URI}/siret/${siret}`).then(v => v.data);
}

export function getCachedCompanyInfos(siret) {
  return cachedGet(getCompanyInfos, COMPANY_INFOS_CACHE_KEY, siret, JSON);
}
