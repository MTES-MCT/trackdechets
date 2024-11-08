import axios from "axios";
import { logger } from "@td/logger";
import { removeSpecialCharsExceptHyphens } from "../../utils";

// https://adresse.data.gouv.fr/api-doc/adresse
export const ADRESSE_DATA_GOUV_FR_URL = "https://api-adresse.data.gouv.fr";

interface Properties {
  label?: string;
  score?: number;
  housenumber?: string;
  id?: string;
  name?: string;
  postcode?: string;
  citycode?: string;
  x?: number;
  y?: number;
  city?: string;
  context?: string;
  type?: string;
  importance?: number;
  street?: string;
}

interface Feature {
  type?: string;
  geometry?: any;
  properties?: Properties;
}

interface ApiResponse {
  type?: string;
  version?: string;
  features?: Feature[];
}

/**
 * Retrieves the codeCommune of an address
 */
export async function getCodeCommune(address: string) {
  if (!Boolean(address)) {
    return null;
  }

  try {
    // Field is vulnerable to injection. Sanitize first
    const sanitizedAddress = removeSpecialCharsExceptHyphens(address).trim();

    // Addr will be URL param, so change "2 rue des.." to "2+rue+des..."
    // Also limit payload size to prevent hacks or DOS
    const addr = sanitizedAddress.replace(/ /g, "+").substring(0, 150);

    if (!Boolean(addr)) {
      return null;
    }

    const fullUrl = `${ADRESSE_DATA_GOUV_FR_URL}/search/?q=${addr}`;

    const res = await axios.get<ApiResponse>(fullUrl);

    if (res.data.features) {
      const cityCodes = res.data.features
        ?.map(feature => feature?.properties?.citycode)
        ?.filter(Boolean);

      if (cityCodes.length) return cityCodes.shift();
    }

    return null;
  } catch (_) {
    logger.error(
      `Error while trying to retrieve codeCommune for address: "${address}"`
    );
  }

  return null;
}
