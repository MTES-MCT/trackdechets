import axios from "axios";
import { logger } from "@td/logger";

const GEO_API_BASE_URL = "https://geo.api.gouv.fr";

/**
 * Retrieves the departement of a company
 */
export async function getDepartement(codeCommune: string) {
  try {
    const res = await axios.get<{ codeDepartement: string }>(
      `${GEO_API_BASE_URL}/communes/${codeCommune}`
    );
    return res.data.codeDepartement;
  } catch (_) {
    logger.error(
      `Error while trying to retrieve departement for commune: "${codeCommune}"`
    );
  }
  return null;
}
