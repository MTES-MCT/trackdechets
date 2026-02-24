/**
 * Helpers for the official French government Geo API (geo.api.gouv.fr).
 *
 * Documentation: https://geo.api.gouv.fr/decoupage-administratif/communes
 */

const GEO_API_COMMUNES_URL = "https://geo.api.gouv.fr/communes";

/**
 * Fetch the city name for a given INSEE commune code.
 *
 * @example
 * const city = await fetchCityNameByInseeCode("75056"); // "Paris"
 */
export async function fetchCityNameByInseeCode(
  inseeCode: string
): Promise<string> {
  try {
    const response = await fetch(
      `${GEO_API_COMMUNES_URL}/${inseeCode}?fields=nom`
    );

    if (!response.ok) return "";

    const data = await response.json();

    return data?.nom ?? "";
  } catch {
    return "";
  }
}

/**
 * Reverse-geocode GPS coordinates (WGS 84) to the commune that contains them.
 * Returns the commune's INSEE code and city name, or `null` if no commune was
 * found (e.g. coordinates outside metropolitan France / overseas territories).
 *
 * @example
 * const commune = await fetchCommuneByCoords(48.8566, 2.3522);
 */
export async function fetchCommuneByCoords(
  lat: number,
  lng: number
): Promise<{ inseeCode: string; city: string } | null> {
  try {
    const response = await fetch(
      `${GEO_API_COMMUNES_URL}?lat=${lat}&lon=${lng}&fields=nom,code&limit=1`
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return { inseeCode: data[0].code ?? "", city: data[0].nom ?? "" };
    }

    return null;
  } catch {
    return null;
  }
}
