import React, { useCallback, useEffect, useMemo, useState } from "react";
import Alert, { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";

import { FieldError, useFieldArray, type UseFormReturn } from "react-hook-form";
import clsx from "clsx";

import Gp from "geoportal-access-lib";
import { Map, MapBrowserEvent } from "ol";
import { Point } from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";
import {
  createEmpty as createEmptyExtent,
  extend as extendExtent,
  isEmpty as isEmptyExtent
} from "ol/extent";
import "geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "ol/ol.css";

import { formatError } from "../../builder/error";
import styles from "./ParcelsVisualizer.module.scss";
import { ClickableTag } from "./ClickableTag";
import {
  getView,
  createMap,
  getParcel,
  lonLatFromCoordinatesString,
  addPointToMap,
  removePointFromMap,
  addParcelToMap,
  removeParcelFromMap,
  displayCoordinates,
  displayParcel,
  AddressSuggestion
} from "./utils";
import { AddressInput } from "./AddressInput";

type Props = {
  prefix: string;
  methods: UseFormReturn<any>;
  disabled?: boolean;
  hideIfDisabled?: boolean;
  title?: string;
};

enum Mode {
  CODE = "CODE",
  GPS = "GPS"
}

export function ParcelsVisualizer({
  methods,
  disabled,
  hideIfDisabled = false,
  prefix,
  title
}: Props) {
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
  const [coordinates, setCoordinates] = useState<string>("");
  const [parcelNumber, setParcelNumber] = useState<string>("");
  const [inseeCode, setInseeCode] = useState<string>("");
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
    if (disabled && hideIfDisabled) {
      return;
    }
    Gp.Services.getConfig({
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
        } catch {
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
  }, [disabled, hideIfDisabled]);

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

  if (hideIfDisabled && disabled) {
    return null;
  }

  return (
    <div className="fr-col">
      <h5 className="fr-h5">{title ?? "Parcelles"}</h5>

      <div className="fr-mb-2w">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top">
          <div className={clsx(styles.controls, "fr-col-md-6")}>
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
            <AddressInput
              disabled={disabled}
              onAddressSelected={setSelectedAddress}
            />
            <div className={styles.or}>{"ou"}</div>
            {mode === Mode.CODE ? (
              <div className="fr-mt-1w">
                <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
                  <div className={clsx("fr-col-md-6", styles.controlledInput)}>
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
                      "fr-col-md-6",
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
                          text: "Affichage de la parcelle impossible : veuillez renseigner le code INSEE",
                          severity: "error",
                          field: "inseeCode"
                        });
                        return;
                      }
                      if (!parcelNumber) {
                        setClientError({
                          text: "Affichage de la parcelle impossible : veuillez renseigner le numéro de parcelle",
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
                          text: "Affichage de la parcelle impossible : les informations renseignées semblent incorrectes",
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
                    onClick={async () => {
                      if (!inseeCode) {
                        setClientError({
                          text: "Ajout de la parcelle impossible : veuillez renseigner le code INSEE",
                          severity: "error",
                          field: "inseeCode"
                        });
                        return;
                      }
                      if (!parcelNumber) {
                        setClientError({
                          text: "Ajout de la parcelle impossible : veuillez renseigner le numéro de parcelle",
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
                          text: "Ajout de la parcelle impossible : les informations renseignées semblent incorrectes",
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
                <div className={clsx("fr-col-md-12", styles.controlledInput)}>
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
                          text: "Affichage du point impossible : veuillez renseigner les coordonnées GPS",
                          severity: "error",
                          field: "coordinates"
                        });
                        return;
                      }
                      const res = displayCoordinates(coordinates, map);
                      if (!res) {
                        setClientError({
                          text: "Affichage du point impossible : les informations renseignées semblent incorrectes",
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
                      if (!coordinates) {
                        setClientError({
                          text: "Ajout du point impossible : veuillez renseigner les coordonnées GPS",
                          severity: "error",
                          field: "coordinates"
                        });
                        return;
                      }
                      const lonLat = lonLatFromCoordinatesString(coordinates);
                      if (lonLat) {
                        const res = addPointToMap(
                          new Point(lonLat),
                          map,
                          markerLayerId
                        );
                        if (!res) {
                          setClientError({
                            text: "Ajout du point impossible : les informations renseignées semblent incorrectes",
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
                          text: "Ajout du point impossible : les informations renseignées semblent incorrectes",
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
                    <ClickableTag
                      key={`${parcel.value}-${idx}`}
                      text={parcel.value}
                      disabled={disabled}
                      status={
                        parcel.mode === Mode.CODE
                          ? inseeCodeErrors?.[parcel.index] ||
                            numberErrors?.[parcel.index]
                          : coordinatesErrors?.[parcel.index]
                          ? "error"
                          : null
                      }
                      onDismiss={() => deleteParcel(parcel.mode, parcel.index)}
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
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="fr-col-12 fr-col-md-6">
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
