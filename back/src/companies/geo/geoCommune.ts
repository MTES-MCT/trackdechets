import axios from "axios";
import { logger } from "@td/logger";

const GEO_API_BASE_URL = "https://geo.api.gouv.fr";

interface CommuneResponse {
  nom: string;
  code: string;
}

/**
 * Fetch the city name for a given INSEE commune code.
 *
 * @example
 * const city = await getCityNameByInseeCode("75056"); // "Paris"
 */
export async function getCityNameByInseeCode(
  inseeCode: string
): Promise<string> {
  try {
    const res = await axios.get<CommuneResponse>(
      `${GEO_API_BASE_URL}/communes/${inseeCode}?fields=nom`
    );

    return res.data?.nom ?? "";
  } catch (_) {
    logger.error(
      `Error while trying to retrieve city name for INSEE code: "${inseeCode}"`
    );
  }

  return "";
}

/**
 * Reverse-geocode GPS coordinates (WGS 84) to the commune that contains them.
 * Returns the commune's INSEE code and city name, or `null` if no commune was
 * found (e.g. coordinates outside metropolitan France / overseas territories).
 *
 * @example
 * const commune = await getCommuneByCoords(48.8566, 2.3522);
 */
export async function getCommuneByCoords(
  lat: number,
  lng: number
): Promise<{ inseeCode: string; city: string } | null> {
  try {
    const res = await axios.get<CommuneResponse[]>(
      `${GEO_API_BASE_URL}/communes?lat=${lat}&lon=${lng}&fields=nom,code&limit=1`
    );

    if (Array.isArray(res.data) && res.data.length > 0) {
      return {
        inseeCode: res.data[0].code ?? "",
        city: res.data[0].nom ?? ""
      };
    }

    return null;
  } catch (_) {
    logger.error(
      `Error while trying to retrieve commune for coordinates: (${lat}, ${lng})`
    );
  }

  return null;
}
