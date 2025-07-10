import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { formatError } from "../builder/error";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import styles from "./ParcelsVisualizer.module.scss";
import clsx from "clsx";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { debounce } from "../../../common/helper";

// leaflet
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// extensions
import { Services, LExtended } from "geoportal-extensions-leaflet";
import "geoportal-extensions-leaflet/dist/GpPluginLeaflet-src.css";
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

const createMap = (): L.Map => {
  // Création de la map
  const baseLayer = (LExtended as any).geoportalLayer.WMTS({
    layer: "ORTHOIMAGERY.ORTHOPHOTOS"
  });

  const cadastralLayer = (LExtended as any).geoportalLayer.WMTS({
    layer: "CADASTRALPARCELS.PARCELLAIRE_EXPRESS"
  });

  const roadsLayer = (LExtended as any).geoportalLayer.WMTS(
    {
      layer: "TRANSPORTNETWORKS.ROADS"
    },
    {
      opacity: 0.7,
      minZoom: 14
    }
  );

  const map = L.map("parcels-map", {
    zoom: 5,
    center: L.latLng(46.4983, 2.1752)
  });

  map.on("click", e => {
    console.log("click", e);
  });
  map.on("zoomend", e => {
    console.log(map.getZoom());
  });

  map.on("moveend", () => {
    console.log(map.getCenter());
  });

  baseLayer.addTo(map);
  cadastralLayer.addTo(map);
  roadsLayer.addTo(map);
  return map;
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

type AddressSuggestion = {
  fulltext: string;
  lat: number;
  lng: number;
};

export function ParcelsVisualizer({ methods, disabled, prefix, title }: Props) {
  const { errors } = methods.formState;
  const [mode, setMode] = useState<Mode>(Mode.CODE);
  const [map, setMap] = useState<L.Map | null>(null);
  const [searchString, setSearchString] = useState<string>("");
  const [showSearch, setShowSearch] = useState(false);
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

  useEffect(() => {
    Services.getConfig({
      onSuccess: () => {
        const map = createMap();
        setMap(map);
      }
    });
  }, []);

  const setSelectedAddress = (address: AddressSuggestion) => {
    if (map) {
      map.setView([address.lat, address.lng], 17);
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

  function deleteParcel(mode: Mode, index: number) {
    if (mode === Mode.CODE) {
      removeInseeCode(index);
      removeNumber(index);
    }
    if (mode === Mode.GPS) {
      removeCoordinate(index);
    }
  }
  const inseeCodeValues: { value: string }[] = methods.watch(
    `${prefix}InseeCodes`
  );
  const numberValues: { value: string }[] = methods.watch(`${prefix}Numbers`);
  const coordinatesValues: { value: string }[] = methods.watch(
    `${prefix}Coordinates`
  );
  const tags = useMemo(() => {
    const numberFields = inseeCodeValues.map((field, index) => {
      return {
        value: `${field.value}-${numberValues[index].value}`,
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
                      hintText="Code postal ou code INSEE"
                      nativeInputProps={{
                        type: "text",
                        onChange: e => {
                          console.log(e.currentTarget.value);
                        }
                      }}
                    />
                  </div>
                  <div className="fr-col-6">
                    <Input
                      label="Numéro de parcelle"
                      hintText="Ex: 000-AB-125"
                      nativeInputProps={{
                        type: "text",
                        onChange: e => {
                          console.log(e.currentTarget.value);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="fr-mt-1w">
                  <Button type="button" priority="secondary" onClick={() => {}}>
                    Afficher la parcelle et sélectionner sur la carte
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
                    onChange: e => {
                      console.log(e.currentTarget.value);
                    }
                  }}
                />
                <div className={styles.gpsButtons}>
                  <Button type="button" priority="secondary" onClick={() => {}}>
                    Afficher les coordonnées
                  </Button>
                  <Button type="button" priority="secondary" onClick={() => {}}>
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
