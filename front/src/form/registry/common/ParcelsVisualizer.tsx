import Alert, { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { FieldError, useFieldArray, type UseFormReturn } from "react-hook-form";
import { formatError } from "../builder/error";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import styles from "./ParcelsVisualizer.module.scss";
import clsx from "clsx";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { debounce } from "../../../common/helper";

import { Feature, View, Map, getUid, MapBrowserEvent } from "ol";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Style, Icon, Stroke, Fill } from "ol/style";
import { Geometry, Point } from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";
import { GeoJSON } from "ol/format";

import { Services, olExtended } from "geoportal-extensions-openlayers";
import "geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "ol/ol.css";

import { ComboBox } from "../../../Apps/common/Components/Combobox/Combobox";
import {
  Extent,
  createEmpty as createEmptyExtent,
  extend as extendExtent,
  isEmpty as isEmptyExtent
} from "ol/extent";

type Props = {
  prefix: string;
  methods: UseFormReturn<any>;
  disabled?: boolean;
  title?: string;
};

enum Mode {
  CODE = "CODE",
  GPS = "GPS"
}

const getView = (lonLat: number[], zoom: number) => {
  return new View({
    center: lonLat,
    zoom: zoom,
    zoomFactor: 3,
    maxZoom: 12
  });
};

const createMap = (): {
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

const searchAddress = async (
  searchString: string
): Promise<{
  status: string;
  results: {
    fulltext: string;
    x: number;
    y: number;
  }[];
}> => {
  const response = await fetch(
    `https://data.geopf.fr/geocodage/completion?maximumResponses=5&text=${searchString}`
  );
  const data = await response.json();
  return data;
};

const getParcel = async (
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

type AddressSuggestion = {
  fulltext: string;
  lat: number;
  lng: number;
};

const lonLatFromCoordinatesString = (coordinates: string): number[] | null => {
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

const addPointToMap = (
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

const removePointFromMap = (
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

const addParcelToMap = async (
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

const removeParcelFromMap = (
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

const displayCoordinates = (coordinates: string, map: Map | null): boolean => {
  const lonLat = lonLatFromCoordinatesString(coordinates);
  console.log("lonLat", lonLat);
  if (lonLat) {
    if (map) {
      map.setView(getView(lonLat, 11));
    }
    return true;
  }
  return false;
};

const displayParcel = async (
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

/**
 * Custom tag content component with text and dismissible cross
 */
const TagContent = ({
  text,
  onDismiss,
  onTagClick,
  disabled
}: {
  text: string;
  onDismiss: () => void;
  onTagClick?: () => void;
  disabled?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      gap: "4px"
    }}
  >
    <span
      onClick={onTagClick}
      style={{
        flex: 1,
        cursor: onTagClick ? "pointer" : "default"
      }}
    >
      {text}
    </span>
    {!disabled && (
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onDismiss();
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "16px",
          height: "16px",
          marginRight: "-0.25rem"
        }}
        aria-label="Supprimer"
      >
        <span
          className="fr-icon--sm fr-icon-close-line"
          style={{ fontSize: "12px" }}
          aria-hidden="true"
        />
      </button>
    )}
  </div>
);

export function ParcelsVisualizer({ methods, disabled, prefix, title }: Props) {
  const { errors } = methods.formState;
  const [clientError, setClientError] = useState<{
    text: string;
    severity: AlertProps.Severity;
    field: "inseeCode" | "parcelNumber" | "coordinates" | null;
  } | null>(null);
  const [mode, setMode] = useState<Mode>(Mode.CODE);
  const [map, setMap] = useState<Map | null>(null);
  const [markerLayerId, setMarkerLayerId] = useState<string | null>(null);
  const [parcelLayerId, setParcelLayerId] = useState<string | null>(null);
  const [searchString, setSearchString] = useState<string>("");
  const [showSearch, setShowSearch] = useState(false);
  const [coordinates, setCoordinates] = useState<string>("");
  const [parcelNumber, setParcelNumber] = useState<string>("");
  const [inseeCode, setInseeCode] = useState<string>("");
  const [addressesSuggestions, setAddressesSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const {
    append: appendInseeCode,
    remove: removeInseeCode,
    update: updateInseeCode
  } = useFieldArray({
    control: methods.control,
    name: `${prefix}InseeCodes`
  });

  const {
    append: appendNumber,
    remove: removeNumber,
    update: updateNumber
  } = useFieldArray({
    control: methods.control,
    name: `${prefix}Numbers`
  });

  const {
    append: appendCoordinate,
    remove: removeCoordinate,
    update: updateCoordinate
  } = useFieldArray({
    control: methods.control,
    name: `${prefix}Coordinates`
  });

  const exploitCoordinates = useCallback(
    async (coordinates: { lat: number; lng: number }) => {
      setClientError(null);
      if (mode === Mode.CODE) {
        const parcel = await getParcel(coordinates.lat, coordinates.lng);
        if (parcel) {
          setParcelNumber(parcel.parcelNumber);
          setInseeCode(parcel.inseeCode);
        } else {
          setParcelNumber("");
          setInseeCode("");
          setClientError({
            text: "Aucune parcelle à ces coordonnées, utilisez les coordonnées GPS si vous voulez ajouter ce point",
            severity: "info",
            field: null
          });
        }
      } else {
        setCoordinates(`${coordinates.lat} ${coordinates.lng}`);
      }
    },
    [mode, setCoordinates, setParcelNumber, setInseeCode]
  );

  const inseeCodeValues: { value: string; featureId?: string }[] =
    methods.watch(`${prefix}InseeCodes`);
  const numberValues: { value: string }[] = methods.watch(`${prefix}Numbers`);
  const coordinatesValues: { value: string; featureId?: string }[] =
    methods.watch(`${prefix}Coordinates`);
  const inseeCodeErrors = errors?.[`${prefix}InseeCodes`];
  const numberErrors = errors?.[`${prefix}Numbers`];
  const coordinatesErrors = errors?.[`${prefix}Coordinates`];
  const backendErrors = useMemo(() => {
    // this looks dumb, but poor typing prevents us from simply enumerating the errors as an array
    const errs: FieldError[] = [];
    inseeCodeValues.forEach((_, index) => {
      if (inseeCodeErrors?.[index]) {
        errs.push(inseeCodeErrors?.[index]);
      }
    });
    numberValues.forEach((_, index) => {
      if (numberErrors?.[index]) {
        errs.push(numberErrors?.[index]);
      }
    });
    coordinatesValues.forEach((_, index) => {
      if (coordinatesErrors?.[index]) {
        errs.push(coordinatesErrors?.[index]);
      }
    });
    return errs;
  }, [
    inseeCodeErrors,
    numberErrors,
    coordinatesErrors,
    inseeCodeValues,
    numberValues,
    coordinatesValues
  ]);

  const deleteParcel = useCallback(
    (mode: Mode, index: number) => {
      if (mode === Mode.CODE) {
        const featureId = inseeCodeValues[index]?.featureId;
        if (featureId) {
          removeParcelFromMap(featureId, map, parcelLayerId);
        }
        removeInseeCode(index);
        removeNumber(index);
      }
      if (mode === Mode.GPS) {
        const featureId = coordinatesValues[index]?.featureId;
        if (featureId) {
          removePointFromMap(featureId, map, markerLayerId);
        }
        removeCoordinate(index);
      }
    },
    [
      inseeCodeValues,
      coordinatesValues,
      map,
      parcelLayerId,
      markerLayerId,
      removeInseeCode,
      removeNumber,
      removeCoordinate
    ]
  );

  useEffect(() => {
    Services.getConfig({
      customConfigFile: "/mapbox/customConfig.json",
      callbackSuffix: "",
      onSuccess: async () => {
        let map: Map;
        let markerLayerId: string;
        let parcelLayerId: string;
        try {
          const res = createMap();
          map = res.map;
          markerLayerId = res.markerLayerId;
          parcelLayerId = res.parcelLayerId;
        } catch (e) {
          console.error(e);
          setClientError({
            text: "Erreur lors de la création de la carte",
            severity: "error",
            field: null
          });
          return;
        }

        setMap(map);
        setMarkerLayerId(markerLayerId);
        setParcelLayerId(parcelLayerId);
        let globalExtent = createEmptyExtent();
        if (inseeCodeValues.length > 0) {
          for (let i = 0; i < inseeCodeValues.length; i++) {
            const inseeCode = inseeCodeValues[i];
            const number = numberValues[i];
            if (inseeCode.value && number.value) {
              const res = await addParcelToMap(
                inseeCode.value,
                number.value,
                map,
                parcelLayerId
              );
              if (res) {
                updateInseeCode(i, {
                  value: inseeCode.value,
                  featureId: res.featureId
                });
                updateNumber(i, { value: number.value });
                globalExtent = extendExtent(globalExtent, res.extent);
              }
            }
          }
        }
        if (coordinatesValues.length > 0) {
          for (let i = 0; i < coordinatesValues.length; i++) {
            const coordinate = coordinatesValues[i];
            if (coordinate.value) {
              const lonLat = lonLatFromCoordinatesString(coordinate.value);
              if (lonLat) {
                const res = addPointToMap(
                  new Point(lonLat),
                  map,
                  markerLayerId
                );
                if (res) {
                  updateCoordinate(i, {
                    value: coordinate.value,
                    featureId: res.featureId
                  });
                  globalExtent = extendExtent(globalExtent, res.extent);
                }
              }
            }
          }
        }
        if (!isEmptyExtent(globalExtent)) {
          map.getView().fit(globalExtent, {
            padding: [50, 50, 50, 50]
          });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: MapBrowserEvent<MouseEvent>) => {
      if (disabled) {
        return;
      }
      const lonLat = toLonLat(e.coordinate);
      exploitCoordinates({ lat: lonLat[1], lng: lonLat[0] });
    };
    if (map) {
      map.on("singleclick", handler);
    }
    return () => {
      if (map) {
        map.un("singleclick", handler);
      }
    };
  }, [map, exploitCoordinates, disabled]);

  useEffect(() => {
    if (disabled) {
      inseeCodeValues.forEach((_, index) => {
        deleteParcel(Mode.CODE, index);
      });
      coordinatesValues.forEach((_, index) => {
        deleteParcel(Mode.GPS, index);
      });
    }
  }, [disabled, inseeCodeValues, coordinatesValues, deleteParcel]);

  const setSelectedAddress = (address: AddressSuggestion) => {
    if (map) {
      map.setView(getView(fromLonLat([address.lng, address.lat]), 11));
    }
  };

  const debouncedSearch = useMemo(
    () =>
      debounce(async text => {
        if (text.length < 3) {
          setAddressesSuggestions([]);
          return;
        }
        try {
          const res = await searchAddress(text);
          if (res.status === "OK") {
            setAddressesSuggestions(
              res.results.map(r => ({
                fulltext: r.fulltext,
                lat: r.y,
                lng: r.x
              }))
            );
            setShowSearch(true);
            return;
          }
          setAddressesSuggestions([]);
        } catch (error) {
          console.error(error);
          setAddressesSuggestions([]);
        }
      }, 500),
    [setAddressesSuggestions, setShowSearch]
  );

  const tags = useMemo((): { value: string; mode: Mode; index: number }[] => {
    const numberFields = inseeCodeValues.map((field, index) => {
      return {
        value: `${field.value} | ${numberValues[index].value}`,
        mode: Mode.CODE,
        index
      };
    });
    const coordinatesFields = coordinatesValues.map((field, index) => {
      return {
        value: field.value,
        mode: Mode.GPS,
        index
      };
    });
    return [...numberFields, ...coordinatesFields];
  }, [inseeCodeValues, numberValues, coordinatesValues]);

  return (
    <div className="fr-col">
      <h5 className="fr-h5">{title ?? "Parcelles"}</h5>

      <div className="fr-mb-2w">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top">
          <div className={clsx(styles.controls, "fr-col-6")}>
            <SegmentedControl
              hideLegend
              segments={[
                {
                  label: "Cadastre",
                  nativeInputProps: {
                    defaultChecked: true,
                    value: Mode.CODE,
                    onChange: v => setMode(v.currentTarget.value as Mode)
                  }
                },
                {
                  label: "Coordonnées GPS",
                  nativeInputProps: {
                    value: Mode.GPS,
                    onChange: v => setMode(v.currentTarget.value as Mode)
                  }
                }
              ]}
            />
            {/* <label className="fr-label fr-mt-1w" htmlFor="parcels-search">
              Adresse complète
            </label> */}
            <div className={styles.searchBar}>
              <Input
                id="parcels-search"
                label="Adresse complète"
                className="fr-mt-1w fr-mb-1w"
                ref={addressInputRef}
                disabled={disabled}
                nativeInputProps={{
                  value: searchString,
                  type: "search",
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchString(e.currentTarget.value);
                    debouncedSearch(e.currentTarget.value);
                  },
                  onFocus: () => {
                    if (addressesSuggestions.length > 0) {
                      setShowSearch(true);
                    }
                  }
                }}
              />
              {searchString && (
                <button
                  type="button"
                  className={styles.customCancelButton}
                  onClick={() => {
                    setSearchString("");
                    setAddressesSuggestions([]);
                    setShowSearch(false);
                    if (addressInputRef.current) {
                      addressInputRef.current.focus();
                    }
                  }}
                  aria-label="Effacer la recherche"
                >
                  <span
                    aria-hidden="true"
                    className="fr-icon-close-circle-fill fr-icon--sm"
                  ></span>
                </button>
              )}
            </div>

            <ComboBox
              parentRef={addressInputRef}
              isOpen={showSearch}
              onOpenChange={setShowSearch}
            >
              {() => (
                <div>
                  {addressesSuggestions.map((address, index) => (
                    <div
                      className="tw-px-2 tw-py-2 hover:tw-bg-gray-100 tw-cursor-pointer"
                      key={`${address.fulltext}-${index}`}
                      onClick={() => {
                        setSelectedAddress({
                          fulltext: address.fulltext,
                          lat: address.lat,
                          lng: address.lng
                        });
                        setAddressesSuggestions(
                          addressesSuggestions.filter((a, idx) => idx === index)
                        );
                        setSearchString(address.fulltext);
                        setShowSearch(false);
                      }}
                    >
                      {address.fulltext}
                    </div>
                  ))}
                </div>
              )}
            </ComboBox>
            <div className={styles.or}>{"ou"}</div>
            {mode === Mode.CODE ? (
              <div className="fr-mt-1w">
                <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
                  <div className={clsx("fr-col-6", styles.controlledInput)}>
                    <Input
                      label="Commune"
                      className="fr-mb-1w"
                      hintText="Code INSEE"
                      disabled={disabled}
                      state={
                        clientError?.field === "inseeCode" ? "error" : undefined
                      }
                      nativeInputProps={{
                        type: "text",
                        placeholder: "75056",
                        value: inseeCode,
                        onChange: e => {
                          setInseeCode(e.currentTarget.value);
                        }
                      }}
                    />
                  </div>
                  <div
                    className={clsx(
                      "fr-col-6",
                      styles.parcelNumber,
                      styles.controlledInput
                    )}
                  >
                    <Input
                      label="Numéro de parcelle"
                      className="fr-mb-1w"
                      hintText={`Préfixe-Section-Numéro`}
                      disabled={disabled}
                      state={
                        clientError?.field === "parcelNumber"
                          ? "error"
                          : undefined
                      }
                      nativeInputProps={{
                        type: "text",
                        placeholder: "000-AB-125",
                        value: parcelNumber,
                        onChange: e => {
                          setParcelNumber(e.currentTarget.value);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className={styles.gpsButtons}>
                  <Button
                    type="button"
                    priority="secondary"
                    disabled={disabled}
                    onClick={async () => {
                      if (!inseeCode) {
                        setClientError({
                          text: "Impossible d'afficher la parcelle, veuillez renseigner le code INSEE",
                          severity: "error",
                          field: "inseeCode"
                        });
                        return;
                      }
                      if (!parcelNumber) {
                        setClientError({
                          text: "Impossible d'afficher la parcelle, veuillez renseigner le numéro de parcelle",
                          severity: "error",
                          field: "parcelNumber"
                        });
                        return;
                      }
                      const res = await displayParcel(
                        inseeCode,
                        parcelNumber,
                        map
                      );
                      if (!res) {
                        setClientError({
                          text: "Impossible d'afficher la parcelle, etes vous sûr que le numéro de parcelle est correct ?",
                          severity: "warning",
                          field: null
                        });
                      }
                    }}
                  >
                    Afficher sur la carte
                  </Button>
                  <Button
                    type="button"
                    priority="secondary"
                    disabled={disabled}
                    onClick={async () => {
                      if (!inseeCode) {
                        setClientError({
                          text: "Impossible d'afficher la parcelle, veuillez renseigner le code INSEE",
                          severity: "error",
                          field: "inseeCode"
                        });
                        return;
                      }
                      if (!parcelNumber) {
                        setClientError({
                          text: "Impossible d'afficher la parcelle, veuillez renseigner le numéro de parcelle",
                          severity: "error",
                          field: "parcelNumber"
                        });
                        return;
                      }
                      const res = await addParcelToMap(
                        inseeCode,
                        parcelNumber,
                        map,
                        parcelLayerId
                      );
                      if (res) {
                        appendInseeCode({
                          value: inseeCode,
                          featureId: res.featureId
                        });
                        appendNumber({ value: parcelNumber });
                        setClientError(null);
                      } else {
                        setClientError({
                          text: "Impossible d'ajouter la parcelle, etes vous sûr que le numéro de parcelle est correct ?",
                          severity: "warning",
                          field: null
                        });
                      }
                    }}
                  >
                    Ajouter la parcelle
                  </Button>
                </div>
              </div>
            ) : (
              <div className="fr-mt-1w">
                <div className={clsx("fr-col-12", styles.controlledInput)}>
                  <Input
                    label="Coordonnées GPS"
                    className="fr-mb-1w"
                    hintText="Format: un point pour les décimales"
                    disabled={disabled}
                    state={
                      clientError?.field === "coordinates" ? "error" : undefined
                    }
                    nativeInputProps={{
                      placeholder: "48.852197 2.310674",
                      type: "text",
                      value: coordinates,
                      onChange: e => {
                        setCoordinates(e.currentTarget.value);
                      }
                    }}
                  />
                </div>
                <div className={styles.gpsButtons}>
                  <Button
                    type="button"
                    priority="secondary"
                    disabled={disabled}
                    onClick={() => {
                      if (!coordinates) {
                        setClientError({
                          text: "Impossible d'afficher le point, veuillez renseigner les coordonnées GPS",
                          severity: "error",
                          field: "coordinates"
                        });
                        return;
                      }
                      const res = displayCoordinates(coordinates, map);
                      if (!res) {
                        setClientError({
                          text: "Impossible d'afficher le point, etes vous sûr que les coordonnées GPS sont correctes ?",
                          severity: "warning",
                          field: null
                        });
                        return;
                      }
                      setClientError(null);
                    }}
                  >
                    Afficher sur la carte
                  </Button>
                  <Button
                    type="button"
                    priority="secondary"
                    disabled={disabled}
                    onClick={() => {
                      const lonLat = lonLatFromCoordinatesString(coordinates);
                      if (lonLat) {
                        const res = addPointToMap(
                          new Point(lonLat),
                          map,
                          markerLayerId
                        );
                        console.log("res", res);
                        if (!res) {
                          setClientError({
                            text: "Impossible d'ajouter le point, etes vous sûr que les coordonnées GPS sont correctes ?",
                            severity: "warning",
                            field: null
                          });
                          return;
                        }
                        appendCoordinate({
                          value: coordinates,
                          featureId: res.featureId
                        });
                        setClientError(null);
                      } else {
                        setClientError({
                          text: "Impossible d'ajouter le point, etes vous sûr que les coordonnées GPS sont correctes ?",
                          severity: "warning",
                          field: null
                        });
                      }
                    }}
                  >
                    Ajouter le point
                  </Button>
                </div>
              </div>
            )}
            {clientError && (
              <Alert
                className="fr-mt-2w"
                description={clientError.text}
                severity={clientError.severity}
                small
              />
            )}
            {backendErrors.length > 0 &&
              backendErrors.map((error, index) => (
                <Alert
                  key={`${index}`}
                  className="fr-mt-2w"
                  description={formatError(error)}
                  severity="error"
                  small
                />
              ))}
            {tags.length > 0 && (
              <div className="fr-mt-1w">
                <div>Parcelles sélectionnées sur la carte</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {tags?.map((parcel, idx) => (
                    <div
                      key={`${parcel.value}-${idx}`}
                      className={
                        (
                          parcel.mode === Mode.CODE
                            ? inseeCodeErrors?.[parcel.index] ||
                              numberErrors?.[parcel.index]
                            : coordinatesErrors?.[parcel.index]
                        )
                          ? styles.errorTag
                          : styles.tag
                      }
                    >
                      <Tag
                        className="fr-mb-1v"
                        dismissible={false}
                        nativeButtonProps={{
                          type: "button",
                          disabled
                        }}
                      >
                        <TagContent
                          text={parcel.value}
                          disabled={disabled}
                          onDismiss={() =>
                            deleteParcel(parcel.mode, parcel.index)
                          }
                          onTagClick={() => {
                            if (parcel.mode === Mode.CODE) {
                              displayParcel(
                                inseeCodeValues[parcel.index].value,
                                numberValues[parcel.index].value,
                                map
                              );
                            } else {
                              displayCoordinates(
                                coordinatesValues[parcel.index].value,
                                map
                              );
                            }
                          }}
                        />
                      </Tag>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="fr-col-6">
            <div id="parcels-map" className={styles.map}></div>
          </div>
        </div>
      </div>

      {errors?.[`${prefix}Coordinates`] && (
        <Alert
          className="fr-mt-2w"
          description={formatError(errors[`${prefix}Coordinates`])}
          severity="error"
          small
        />
      )}
    </div>
  );
}
