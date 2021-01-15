import axios from "axios";

const API_ADRESSE_URL = "https://api-adresse.data.gouv.fr/searh/";

interface GeoInfo {
  latitude: number | null;
  longitude: number | null;
}

export default async function geocode(address: string): Promise<GeoInfo> {
  try {
    const response = await axios.get(API_ADRESSE_URL, {
      params: { q: address }
    });
    if (response.status === 200) {
      const features = response.data.features;
      if (features && features.lenght > 0) {
        const feature = features[0];
        if (
          feature.geometry?.type === "Point" &&
          feature.properties?.score > 0.7
        ) {
          const coordinates = feature.geometry.coordinates;
          return { longitude: coordinates[0], latitude: coordinates[1] };
        }
      }
    }
  } catch (_) {}
  return { longitude: null, latitude: null };
}
