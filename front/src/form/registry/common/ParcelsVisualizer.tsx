import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { formatError } from "../builder/error";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import styles from "./ParcelsVisualizer.module.scss";
import clsx from "clsx";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { debounce } from "../../../common/helper";

import { Feature, View, Map, getUid } from "ol";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Style, Icon } from "ol/style";
import { Point } from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";

import { Services, olExtended } from "geoportal-extensions-openlayers";
import "geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "ol/ol.css";

import { ComboBox } from "../../../Apps/common/Components/Combobox/Combobox";

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

const createMap = (): { map: Map; markerLayerId: string } => {
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

  const map = new Map({
    target: "parcels-map",
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
      markerLayer
    ],
    view: new View({
      center: fromLonLat([2.1752, 46.4983]),
      zoom: 3.5,
      zoomFactor: 3,
      maxZoom: 13
    })
  });

  // Création de la map
  // const baseLayer = (LExtended as any).geoportalLayer.WMTS({
  //   layer: "ORTHOIMAGERY.ORTHOPHOTOS"
  // });

  // const cadastralLayer = (LExtended as any).geoportalLayer.WMTS({
  //   layer: "CADASTRALPARCELS.PARCELLAIRE_EXPRESS"
  // });

  // const roadsLayer = (LExtended as any).geoportalLayer.WMTS(
  //   {
  //     layer: "TRANSPORTNETWORKS.ROADS"
  //   },
  //   {
  //     opacity: 0.7,
  //     minZoom: 14
  //   }
  // );

  // const map = L.map("parcels-map", {
  //   zoom: 5,
  //   center: L.latLng(46.4983, 2.1752),
  //   zoomSnap: 0.1,
  //   wheelDebounceTime: 10
  // });

  // map.on("singleclick", e => {
  //   console.log("click", toLonLat(e.coordinate));
  // });
  // map.on("zoomend", e => {
  //   console.log(map.getZoom());
  // });

  map.on("moveend", e => {
    console.log(map.getView().getZoom());
  });

  // baseLayer.addTo(map);
  // cadastralLayer.addTo(map);
  // roadsLayer.addTo(map);
  return { map, markerLayerId };
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
  console.log(data);
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
  console.log(data);
  if (data.features.length > 0) {
    const parcelNumber = `${data.features[0].properties.sheet}-${data.features[0].properties.section}-${data.features[0].properties.number}`;
    const inseeCode = `${data.features[0].properties.departmentcode}${data.features[0].properties.municipalitycode}`;
    return { inseeCode, parcelNumber };
  }
  return null;
};

const getCoordinatesFromParcel = async (
  inseeCode: string,
  parcelNumber: string
): Promise<{ lat: number; lng: number } | null> => {
  const departmentCode = inseeCode.slice(0, 2);
  const municipalityCode = inseeCode.slice(2);
  const split = parcelNumber.split("-");
  const sheet = split[0];
  const section = split[1];
  const number = split[2];

  const response = await fetch(
    `https://data.geopf.fr/geocodage/search?autocomplete=0&index=parcel&limit=1&departmentcode=${departmentCode}&municipalitycode=${municipalityCode}&sheet=${sheet}&section=${section}&number=${number}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );
  const data = await response.json();
  console.log(data);
  if (data.features.length > 0) {
    return {
      lat: data.features[0].geometry.coordinates[1],
      lng: data.features[0].geometry.coordinates[0]
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

export function ParcelsVisualizer({ methods, disabled, prefix, title }: Props) {
  const { errors } = methods.formState;
  const [mode, setMode] = useState<Mode>(Mode.CODE);
  const [map, setMap] = useState<Map | null>(null);
  const [markerLayerId, setMarkerLayerId] = useState<string | null>(null);
  const [searchString, setSearchString] = useState<string>("");
  const [showSearch, setShowSearch] = useState(false);
  const [coordinates, setCoordinates] = useState<string>("");
  const [parcelNumber, setParcelNumber] = useState<string>("");
  const [inseeCode, setInseeCode] = useState<string>("");
  // const [selectedAddress, setSelectedAddress] =
  //   useState<AddressSuggestion | null>(null);
  const [addressesSuggestions, setAddressesSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const {
    fields: inseeCodeFields,
    append: appendInseeCode,
    remove: removeInseeCode
  } = useFieldArray({
    control: methods.control,
    name: `${prefix}InseeCodes`
  });

  const { append: appendNumber, remove: removeNumber } = useFieldArray({
    control: methods.control,
    name: `${prefix}Numbers`
  });

  const {
    fields: coordinatesFields,
    append: appendCoordinate,
    remove: removeCoordinate
  } = useFieldArray({
    control: methods.control,
    name: `${prefix}Coordinates`
  });

  const exploitCoordinates = useCallback(
    async (coordinates: { lat: number; lng: number }) => {
      if (mode === Mode.CODE) {
        const parcel = await getParcel(coordinates.lat, coordinates.lng);
        if (parcel) {
          setParcelNumber(parcel.parcelNumber);
          setInseeCode(parcel.inseeCode);
        }
      } else {
        setCoordinates(`${coordinates.lat} ${coordinates.lng}`);
      }
    },
    [mode, setCoordinates]
  );

  const displayCoordinates = useCallback(
    (coordinates: string) => {
      const lonLat = lonLatFromCoordinatesString(coordinates);
      if (lonLat) {
        if (map) {
          map.setView(
            new View({
              center: lonLat,
              zoom: 11,
              zoomFactor: 3,
              maxZoom: 13
            })
          );
        }
      }
    },
    [map]
  );

  const displayParcel = useCallback(
    async (inseeCode: string, parcelNumber: string) => {
      const coordinates = await getCoordinatesFromParcel(
        inseeCode,
        parcelNumber
      );
      if (coordinates) {
        const lonLat = fromLonLat([coordinates.lng, coordinates.lat]);
        if (lonLat) {
          if (map) {
            map.setView(
              new View({
                center: lonLat,
                zoom: 11,
                zoomFactor: 3,
                maxZoom: 13
              })
            );
          }
        }
      }
    },
    [map]
  );

  const addPointToMap = useCallback(
    (point: Feature<Point>) => {
      if (map) {
        const markerLayer = map
          .getLayers()
          .getArray()
          .find(layer => getUid(layer) === markerLayerId) as VectorLayer<
          VectorSource<Point>
        >;
        if (markerLayer) {
          console.log("markerLayer", markerLayer);
          markerLayer.getSource().addFeature(point);
        }
      }
    },
    [map, markerLayerId]
  );

  const removePointFromMap = useCallback(
    (featureId: string) => {
      if (map) {
        const markerLayer = map
          .getLayers()
          .getArray()
          .find(layer => getUid(layer) === markerLayerId) as VectorLayer<
          VectorSource<Point>
        >;
        if (markerLayer) {
          console.log("markerLayer", markerLayer);
          console.log("featureId", featureId);
          const feature = markerLayer.getSource().getFeatureByUid(featureId);
          console.log("feature", feature);
          if (feature) {
            markerLayer.getSource().removeFeature(feature);
          }
        }
      }
    },
    [map, markerLayerId]
  );

  useEffect(() => {
    Services.getConfig({
      onSuccess: () => {
        const { map, markerLayerId } = createMap();
        setMap(map);
        setMarkerLayerId(markerLayerId);
        console.log("markerLayerId", markerLayerId);
      }
    });
  }, []);

  useEffect(() => {
    const handler = e => {
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
  }, [map, exploitCoordinates]);

  const setSelectedAddress = (address: AddressSuggestion) => {
    if (map) {
      map.setView(
        new View({
          center: fromLonLat([address.lng, address.lat]),
          zoom: 11,
          zoomFactor: 3,
          maxZoom: 13
        })
      );
      // map.setView([address.lat, address.lng], 17);
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
    []
  );

  const inseeCodeValues: { value: string }[] = methods.watch(
    `${prefix}InseeCodes`
  );
  const numberValues: { value: string }[] = methods.watch(`${prefix}Numbers`);
  const coordinatesValues: { value: string; featureId: string }[] =
    methods.watch(`${prefix}Coordinates`);

  function deleteParcel(mode: Mode, index: number) {
    if (mode === Mode.CODE) {
      removeInseeCode(index);
      removeNumber(index);
    }
    if (mode === Mode.GPS) {
      const featureId = coordinatesValues[index]?.featureId;
      if (featureId) {
        removePointFromMap(featureId);
      }
      removeCoordinate(index);
    }
  }

  const tags = useMemo(() => {
    const numberFields = inseeCodeValues.map((field, index) => {
      return {
        value: `${field.value} | ${numberValues[index].value}`,
        mode: Mode.CODE
      };
    });
    const coordinatesFields = coordinatesValues.map(field => {
      return {
        value: field.value,
        mode: Mode.GPS
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
                nativeInputProps={{
                  value: searchString,
                  type: "search",
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchString(e.currentTarget.value);
                    debouncedSearch(e.currentTarget.value);
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
                  <div className="fr-col-6">
                    <Input
                      label="Commune"
                      className="fr-mb-1w"
                      hintText="Code postal ou code INSEE"
                      nativeInputProps={{
                        type: "text",
                        value: inseeCode,
                        onChange: e => {
                          setInseeCode(e.currentTarget.value);
                        }
                      }}
                    />
                  </div>
                  <div className="fr-col-6">
                    <Input
                      label="Numéro de parcelle"
                      className="fr-mb-1w"
                      hintText="Ex: 000-AB-125"
                      nativeInputProps={{
                        type: "text",
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
                    onClick={() => displayParcel(inseeCode, parcelNumber)}
                  >
                    Afficher sur la carte
                  </Button>
                  <Button
                    type="button"
                    priority="secondary"
                    onClick={() => {
                      appendInseeCode({ value: inseeCode });
                      appendNumber({ value: parcelNumber });
                    }}
                  >
                    Ajouter la parcelle
                  </Button>
                </div>
              </div>
            ) : (
              <div className="fr-mt-1w">
                <Input
                  label="Coordonnées GPS"
                  className="fr-mb-1w"
                  hintText="Format: un point pour les décimales, exemple: 48.852197 2.310674"
                  nativeInputProps={{
                    type: "text",
                    value: coordinates,
                    onChange: e => {
                      setCoordinates(e.currentTarget.value);
                    }
                  }}
                />
                <div className={styles.gpsButtons}>
                  <Button
                    type="button"
                    priority="secondary"
                    onClick={() => displayCoordinates(coordinates)}
                  >
                    Afficher sur la carte
                  </Button>
                  <Button
                    type="button"
                    priority="secondary"
                    onClick={() => {
                      const lonLat = lonLatFromCoordinatesString(coordinates);
                      if (lonLat) {
                        const feature = new Feature(new Point(lonLat));
                        const featureId = getUid(feature);
                        appendCoordinate({ value: coordinates, featureId });
                        addPointToMap(feature);
                      }
                    }}
                  >
                    Ajouter le point
                  </Button>
                </div>
              </div>
            )}
            {tags.length > 0 && (
              <div className="fr-mt-1w">
                <div>Parcelles sélectionnées sur la carte</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {tags?.map((parcel, idx) => (
                    <div key={idx}>
                      <Tag
                        className="fr-mb-1v"
                        dismissible={!disabled}
                        nativeButtonProps={{
                          type: "button",
                          disabled,
                          onClick: () => {
                            deleteParcel(parcel.mode, idx);
                          },
                          ...{ "data-testid": "tagsInputTags" }
                        }}
                      >
                        {parcel.value}
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
