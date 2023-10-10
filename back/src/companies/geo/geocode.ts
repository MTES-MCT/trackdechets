import axios from "axios";
import logger from "../../logging/logger";

const API_ADRESSE_URL = "https://api-adresse.data.gouv.fr/search/";

interface GeoInfo {
  latitude: number | null;
  longitude: number | null;
}

type Feature = {
  geometry?: { type: string; coordinates: number[] };
  properties?: { score: number };
};

export async function geocode(
  address: string | null | undefined
): Promise<GeoInfo> {
  if (!address) {
    return { longitude: null, latitude: null };
  }

  try {
    const response = await axios.get<{ features: Feature[] }>(API_ADRESSE_URL, {
      params: { q: address }
    });
    if (response.status === 200) {
      const features = response.data.features;
      if (features && features.length > 0) {
        const feature = features[0];
        if (
          feature.geometry?.type === "Point" &&
          feature.properties?.score &&
          feature.properties.score > 0.6
        ) {
          const coordinates = feature.geometry.coordinates;
          return { longitude: coordinates[0], latitude: coordinates[1] };
        }
      }
    }
  } catch (_) {
    logger.error(`Error while trying to geocode address ${address}`);
  }
  return { longitude: null, latitude: null };
}
