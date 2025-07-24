import { olExtended } from "geoportal-extensions-openlayers";
import { Feature, View, Map, getUid } from "ol";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Style, Icon, Stroke, Fill } from "ol/style";
import { Geometry, Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { GeoJSON } from "ol/format";
import { Extent } from "ol/extent";

export const getView = (lonLat: number[], zoom: number) => {
  return new View({
    center: lonLat,
    zoom: zoom,
    zoomFactor: 3,
    maxZoom: 12
  });
};

export const createMap = (): {
  map: Map;
  markerLayerId: string;
  parcelLayerId: string;
} => {
  const markerLayer = new VectorLayer({
    source: new VectorSource(),
    style: new Style({
      image: new Icon({
        anchor: [0.5, 1],
        scale: 1.5,
        src: "/mapbox/map-pin.svg"
      })
    })
  });
  const markerLayerId = getUid(markerLayer);

  const parcelLayer = new VectorLayer({
    source: new VectorSource(),
    style: new Style({
      stroke: new Stroke({
        color: "#ff0000",
        width: 3
      }),
      fill: new Fill({
        color: "rgba(255, 0, 0, 0.3)"
      })
    })
  });
  const parcelLayerId = getUid(parcelLayer);

  const map = new Map({
    target: "parcels-map",
    maxTilesLoading: 5,
    layers: [
      new olExtended.layer.GeoportalWMS({
        layer: "ORTHOIMAGERY.ORTHOPHOTOS",
        olParams: {
          maxZoom: 19
        }
      }),
      new olExtended.layer.GeoportalWMS({
        layer: "CADASTRALPARCELS.PARCELLAIRE_EXPRESS",
        olParams: {
          maxZoom: 19
        }
      }),
      new olExtended.layer.GeoportalWMS({
        layer: "TRANSPORTNETWORKS.ROADS",
        olParams: {
          opacity: 0.7,
          minZoom: 8,
          maxZoom: 19
        }
      }),
      markerLayer,
      parcelLayer
    ],
    view: getView(fromLonLat([2.1752, 46.4983]), 3.5)
  });

  return { map, markerLayerId, parcelLayerId };
};

export type AddressSuggestion = {
  fulltext: string;
  lat: number;
  lng: number;
};

export const searchAddress = async (
  searchString: string
): Promise<{
  status: string;
  results: AddressSuggestion[];
}> => {
  const response = await fetch(
    `https://data.geopf.fr/geocodage/completion?maximumResponses=5&text=${searchString}`
  );
  const data = await response.json();
  return {
    status: data.status,
    results: data.results.map(
      (r: { fulltext: string; y: number; x: number }) => ({
        fulltext: r.fulltext,
        lat: r.y,
        lng: r.x
      })
    )
  };
};

export const getParcel = async (
  lat: number,
  lng: number
): Promise<{ inseeCode: string; parcelNumber: string } | null> => {
  const response = await fetch(
    `https://data.geopf.fr/geocodage/reverse?index=parcel&limit=1&returntruegeometry=true&searchgeom=${encodeURIComponent(
      JSON.stringify({
        type: "Point",
        coordinates: [lng, lat]
      })
    )}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );
  const data = await response.json();
  if (data.features.length > 0) {
    const parcelNumber = `${data.features[0].properties.districtcode}-${data.features[0].properties.section}-${data.features[0].properties.number}`;
    const inseeCode = `${data.features[0].properties.departmentcode}${data.features[0].properties.municipalitycode}`;
    return { inseeCode, parcelNumber };
  }
  return null;
};

const getCoordinatesFromParcel = async (
  inseeCode: string,
  parcelNumber: string
): Promise<{ lat: number; lng: number; geometry: Geometry } | null> => {
  const departmentCode = inseeCode.slice(0, 2);
  const municipalityCode = inseeCode.slice(2);
  const split = parcelNumber.split("-");
  const prefixOrSheet = split[0];
  const section = split[1];
  const number = split[2];

  let sheet: string | null, prefix: string | null;
  if (prefixOrSheet.length === 3) {
    prefix = prefixOrSheet;
    sheet = null;
  } else {
    sheet = prefixOrSheet;
    prefix = null;
  }

  if (
    !departmentCode ||
    !municipalityCode ||
    (!prefix && !sheet) ||
    !section ||
    !number
  ) {
    return null;
  }

  const response = await fetch(
    `https://data.geopf.fr/geocodage/search?autocomplete=0&index=parcel&limit=1&returntruegeometry=true&departmentcode=${departmentCode}&municipalitycode=${municipalityCode}${
      prefix ? `&districtcode=${prefix}` : ""
    }${sheet ? `&sheet=${sheet}` : ""}&section=${section}&number=${number}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );
  const data = await response.json();
  if (data?.features?.length > 0) {
    return {
      lat: data.features[0].geometry.coordinates[1],
      lng: data.features[0].geometry.coordinates[0],
      geometry: new GeoJSON().readGeometry(
        data.features[0].properties.truegeometry,
        {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857"
        }
      )
    };
  }
  return null;
};

export const lonLatFromCoordinatesString = (
  coordinates: string
): number[] | null => {
  const split = coordinates.split(" ");
  if (split.length === 2) {
    const lat = Number(split[0]);
    const lng = Number(split[1]);
    if (isNaN(lat) || isNaN(lng)) {
      return null;
    }
    return fromLonLat([lng, lat]);
  }
  return null;
};

export const addPointToMap = (
  point: Point,
  map: Map | null,
  markerLayerId: string | null
): { featureId: string; extent: Extent } | null => {
  if (map && markerLayerId) {
    const markerLayer = map
      .getLayers()
      .getArray()
      .find(layer => getUid(layer) === markerLayerId) as VectorLayer<
      VectorSource<Point>
    >;
    if (markerLayer) {
      const feature = new Feature(point);
      const featureId = getUid(feature);
      markerLayer.getSource().addFeature(feature);
      const extent = point.getExtent();
      return { featureId, extent };
    }
  }
  return null;
};

export const removePointFromMap = (
  featureId: string,
  map: Map | null,
  markerLayerId: string | null
) => {
  if (map && markerLayerId) {
    const markerLayer = map
      .getLayers()
      .getArray()
      .find(layer => getUid(layer) === markerLayerId) as VectorLayer<
      VectorSource<Point>
    >;
    if (markerLayer) {
      const feature = markerLayer.getSource().getFeatureByUid(featureId);
      if (feature) {
        markerLayer.getSource().removeFeature(feature);
      }
    }
  }
};

export const addParcelToMap = async (
  inseeCode: string,
  parcelNumber: string,
  map: Map | null,
  parcelLayerId: string | null
): Promise<{ featureId: string; extent: Extent } | null> => {
  if (map && parcelLayerId) {
    const res = await getCoordinatesFromParcel(inseeCode, parcelNumber);
    if (res?.geometry) {
      const parcelLayer = map
        .getLayers()
        .getArray()
        .find(layer => getUid(layer) === parcelLayerId) as VectorLayer<
        VectorSource<Geometry>
      >;
      if (parcelLayer) {
        const feature = new Feature(res.geometry);
        const featureId = getUid(feature);
        parcelLayer.getSource().addFeature(feature);
        const extent = res.geometry.getExtent();
        return { featureId, extent };
      }
    }
  }
  return null;
};

export const removeParcelFromMap = (
  featureId: string,
  map: Map | null,
  parcelLayerId: string | null
) => {
  if (map && parcelLayerId) {
    const parcelLayer = map
      .getLayers()
      .getArray()
      .find(layer => getUid(layer) === parcelLayerId) as VectorLayer<
      VectorSource<Geometry>
    >;
    if (parcelLayer) {
      const feature = parcelLayer.getSource().getFeatureByUid(featureId);
      if (feature) {
        parcelLayer.getSource().removeFeature(feature);
      }
    }
  }
};

export const displayCoordinates = (
  coordinates: string,
  map: Map | null
): boolean => {
  const lonLat = lonLatFromCoordinatesString(coordinates);
  if (lonLat) {
    if (map) {
      map.setView(getView(lonLat, 11));
    }
    return true;
  }
  return false;
};

export const displayParcel = async (
  inseeCode: string,
  parcelNumber: string,
  map: Map | null
): Promise<boolean> => {
  const coordinates = await getCoordinatesFromParcel(inseeCode, parcelNumber);
  if (coordinates) {
    const lonLat = fromLonLat([coordinates.lng, coordinates.lat]);
    if (lonLat) {
      if (map) {
        map.setView(getView(lonLat, 11));
      }
      return true;
    }
  }
  return false;
};
