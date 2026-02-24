import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFormikContext } from "formik";
import Alert, { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import clsx from "clsx";
import Gp from "geoportal-access-lib";
import { Map, MapBrowserEvent } from "ol";
import { Point } from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";
import { createEmpty as createEmptyExtent, extend as extendExtent, isEmpty as isEmptyExtent } from "ol/extent";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import "geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "ol/ol.css";
import { formatError } from "../../builder/error";
import styles from "./ParcelsVisualizer.module.scss";
import { ClickableTag } from "./ClickableTag";
import {
  getView,
  createMap,
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

export type Parcel = {
  inseeCode?: string;
  parcelNumber?: string;
  coordinates?: string;
  featureId?: string;
};

export type FormikParcelsVisualizerProps = {
  prefix: string;
  disabled?: boolean;
  hideIfDisabled?: boolean;
  title?: string;
  onAddParcel?: (parcel: { inseeCode: string; parcelNumber: string }) => void;
};

export function FormikParcelsVisualizer({
  prefix,
  disabled,
  hideIfDisabled = false,
  title,
  onAddParcel
}: FormikParcelsVisualizerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null); // Persist map instance
  const formik = useFormikContext<any>();
  const errors = formik.errors;
  const [clientError, setClientError] = useState<{
    text: string;
    severity: AlertProps.Severity;
    field: "inseeCode" | "parcelNumber" | "coordinates" | null;
  } | null>(null);
  const [mode, setMode] = useState("CODE");
  const [markerLayerId, setMarkerLayerId] = useState<string | null>(null);
  const [parcelLayerId, setParcelLayerId] = useState<string | null>(null);
  const [coordinatesInput, setCoordinatesInput] = useState<string>("");
  const [parcelNumber, setParcelNumber] = useState<string>("");
  const [inseeCode, setInseeCode] = useState<string>("");
  const [addressInput, setAddressInput] = useState<string>("");

  // Get values from Formik
  const inseeCodes = useMemo(
    () => formik.values[`${prefix}InseeCodes`] || [],
    [formik.values, prefix]
  );
  const numbers = useMemo(
    () => formik.values[`${prefix}Numbers`] || [],
    [formik.values, prefix]
  );
  const coordinates = useMemo(
    () => formik.values[`${prefix}Coordinates`] || [],
    [formik.values, prefix]
  );

  const parcels: Parcel[] = inseeCodes.map((insee: any, i: number) => ({
    inseeCode: insee.value,
    parcelNumber: numbers[i]?.value,
    featureId: insee.featureId
  }));
  const coords: Parcel[] = coordinates.map((c: any) => ({
    coordinates: c.value,
    featureId: c.featureId
  }));

  const backendErrors = useMemo(() => {
    // This is a placeholder, adapt as needed for your error structure
    return [];
  }, []);

  const deleteParcel = useCallback(
    (mode: "CODE" | "GPS", index: number) => {
      if (mode === "CODE") {
        const featureId = inseeCodes[index]?.featureId;
        if (featureId) {
          removeParcelFromMap(featureId, mapRef.current, parcelLayerId);
        }
        const newInseeCodes = inseeCodes.filter(
          (_: any, i: number) => i !== index
        );
        const newNumbers = numbers.filter((_: any, i: number) => i !== index);
        formik.setFieldValue(`${prefix}InseeCodes`, newInseeCodes);
        formik.setFieldValue(`${prefix}Numbers`, newNumbers);
      }
      if (mode === "GPS") {
        const featureId = coordinates[index]?.featureId;
        if (featureId) {
          removePointFromMap(featureId, mapRef.current, markerLayerId);
        }
        const newCoordinates = coordinates.filter(
          (_: any, i: number) => i !== index
        );
        formik.setFieldValue(`${prefix}Coordinates`, newCoordinates);
      }
    },
    [
      inseeCodes,
      numbers,
      coordinates,
      parcelLayerId,
      markerLayerId,
      formik,
      prefix
    ]
  );

  // Map initialization: only on mount (or when disabled/hideIfDisabled changes)
  useEffect(() => {
    console.log("[FormikParcelsVisualizer] useEffect mount", {
      disabled,
      hideIfDisabled
    });
    if (disabled && hideIfDisabled) {
      return;
    }
    if (!mapContainerRef.current) {
      console.log("[FormikParcelsVisualizer] No map container ref");
      return;
    }
    if (mapRef.current) {
      console.log(
        "[FormikParcelsVisualizer] Map already initialized, skipping"
      );
      return; // Only initialize once
    }
    console.log("[FormikParcelsVisualizer] Initializing map");
    Gp.Services.getConfig({
      customConfigFile: "/mapbox/customConfig.json",
      callbackSuffix: "",
      onSuccess: () => {
        try {
          const res = createMap(mapContainerRef.current!);
          mapRef.current = res.map;
          setMarkerLayerId(res.markerLayerId);
          setParcelLayerId(res.parcelLayerId);
        } catch {
          setClientError({
            text: "Erreur lors de la création de la carte",
            severity: "error",
            field: null
          });
          console.log("[FormikParcelsVisualizer] Map creation error");
          return;
        }
        console.log("[FormikParcelsVisualizer] Map initialized");
      }
    });
    return () => {
      console.log("[FormikParcelsVisualizer] Cleanup: unmounting map");
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
        mapRef.current = null;
      }
      // Robust cleanup: remove all children from map container
      if (mapContainerRef.current) {
        while (mapContainerRef.current.firstChild) {
          mapContainerRef.current.removeChild(
            mapContainerRef.current.firstChild
          );
        }
        console.log("[FormikParcelsVisualizer] Map container children cleared");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, hideIfDisabled]);

  // Map update: update parcels/coords on map when they change
  useEffect(() => {
    if (!mapRef.current || !parcelLayerId || !markerLayerId) return;
    // Remove all features from layers
    const map = mapRef.current;
    const parcelLayer = map
      .getLayers()
      .getArray()
      .find(
        layer =>
          parcelLayerId &&
          layer &&
          typeof layer.get === "function" &&
          layer.get("ol_uid") === parcelLayerId
      ) as VectorLayer<VectorSource> | undefined;
    const markerLayer = map
      .getLayers()
      .getArray()
      .find(
        layer =>
          markerLayerId &&
          layer &&
          typeof layer.get === "function" &&
          layer.get("ol_uid") === markerLayerId
      ) as VectorLayer<VectorSource> | undefined;
    if (parcelLayer && parcelLayer.getSource) {
      parcelLayer.getSource().clear();
    }
    if (markerLayer && markerLayer.getSource) {
      markerLayer.getSource().clear();
    }
    let globalExtent = createEmptyExtent();
    let onlyCoordinates = true;
    // Add parcels
    (async () => {
      if (parcels.length > 0) {
        onlyCoordinates = false;
        for (let i = 0; i < parcels.length; i++) {
          const { inseeCode, parcelNumber } = parcels[i];
          if (inseeCode && parcelNumber) {
            const res = await addParcelToMap(
              inseeCode,
              parcelNumber,
              map,
              parcelLayerId
            );
            if (res) {
              globalExtent = extendExtent(globalExtent, res.extent);
            }
          }
        }
      }
      // Add coords
      if (coords.length > 0) {
        for (let i = 0; i < coords.length; i++) {
          const { coordinates: coord } = coords[i];
          if (coord) {
            const lonLat = lonLatFromCoordinatesString(coord);
            if (lonLat) {
              const res = addPointToMap(new Point(lonLat), map, markerLayerId);
              if (res) {
                globalExtent = extendExtent(globalExtent, res.extent);
              }
            }
          }
        }
      }
      if (!isEmptyExtent(globalExtent)) {
        map.getView().fit(globalExtent, {
          maxZoom: onlyCoordinates ? 7.5 : 9,
          padding: [50, 50, 50, 50]
        });
      }
    })();
  }, [parcels, coords, parcelLayerId, markerLayerId]);

  useEffect(() => {
    const handler = async (e: MapBrowserEvent<MouseEvent>) => {
      if (disabled) {
        return;
      }
      const lonLat = toLonLat(e.coordinate);
      setCoordinatesInput(`${lonLat[1]} ${lonLat[0]}`);

      // Reverse geocode to get parcel info
      try {
        const res = await import("./utils");
        const parcel = await res.getParcel(lonLat[1], lonLat[0]);
        if (parcel && parcel.inseeCode && parcel.parcelNumber) {
          // Replace any existing parcel with the new one
          formik.setFieldValue(`${prefix}InseeCodes`, [
            { value: parcel.inseeCode }
          ]);
          formik.setFieldValue(`${prefix}Numbers`, [
            { value: parcel.parcelNumber }
          ]);
          // Remove all previously selected parcels from the map
          if (mapRef.current && parcelLayerId) {
            const map = mapRef.current;
            const parcelLayer =
              map
                .getLayers()
                .getArray()
                .find(
                  layer =>
                    parcelLayerId &&
                    layer &&
                    layer &&
                    layer.get &&
                    layer.get("ol_uid") == parcelLayerId
                ) ||
              map
                .getLayers()
                .getArray()
                .find(
                  layer =>
                    layer && layer.get && layer.get("ol_uid") == parcelLayerId
                );
            if (parcelLayer && parcelLayer.getSource) {
              parcelLayer.getSource().clear();
            }
            // Add new parcel
            const utils = await import("./utils");
            await utils.addParcelToMap(
              parcel.inseeCode,
              parcel.parcelNumber,
              map,
              parcelLayerId
            );
          }
          setInseeCode(parcel.inseeCode);
          setParcelNumber(parcel.parcelNumber);
        }
      } catch (err) {
        // Ignore errors, just don't autofill
      }
    };
    if (mapRef.current) {
      mapRef.current.on("singleclick", handler);
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.un("singleclick", handler);
      }
    };
  }, [disabled, parcelLayerId, formik, prefix]);

  const setSelectedAddress = (address: AddressSuggestion) => {
    setAddressInput(address.fulltext);
    if (mapRef.current) {
      mapRef.current.setView(
        getView(fromLonLat([address.lng, address.lat]), 11)
      );
    }
  };

  const tags = useMemo((): {
    value: string;
    mode: "CODE" | "GPS";
    index: number;
  }[] => {
    const numberFields = parcels.map((field, index) => {
      return {
        value: `${field.inseeCode} | ${field.parcelNumber}`,
        mode: "CODE" as const,
        index
      };
    });
    const coordinatesFields = coords.map((field, index) => {
      return {
        value: field.coordinates || "",
        mode: "GPS" as const,
        index
      };
    });
    return [...numberFields, ...coordinatesFields];
  }, [parcels, coords]);

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
                    value: "CODE",
                    onChange: v =>
                      setMode(v.currentTarget.value as "CODE" | "GPS")
                  }
                },
                {
                  label: "Coordonnées GPS",
                  nativeInputProps: {
                    value: "GPS",
                    onChange: v =>
                      setMode(v.currentTarget.value as "CODE" | "GPS")
                  }
                }
              ]}
            />
            <AddressInput
              disabled={disabled}
              onAddressSelected={setSelectedAddress}
            />
            <div className={styles.or}>{"ou"}</div>
            {mode === "CODE" ? (
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
                        onChange: e => setInseeCode(e.currentTarget.value)
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
                        onChange: e => setParcelNumber(e.currentTarget.value)
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
                      // Remove all previously selected parcels from the map
                      if (mapRef.current && parcelLayerId) {
                        const map = mapRef.current;
                        const parcelLayer =
                          map
                            .getLayers()
                            .getArray()
                            .find(
                              layer =>
                                parcelLayerId &&
                                layer &&
                                layer &&
                                layer.get &&
                                layer.get("ol_uid") == parcelLayerId
                            ) ||
                          map
                            .getLayers()
                            .getArray()
                            .find(
                              layer =>
                                layer &&
                                layer.get &&
                                layer.get("ol_uid") == parcelLayerId
                            );
                        if (parcelLayer && parcelLayer.getSource) {
                          parcelLayer.getSource().clear();
                        }
                      }
                      const res = await displayParcel(
                        inseeCode,
                        parcelNumber,
                        mapRef.current
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
                    disabled={
                      disabled ||
                      (inseeCodes.length === 1 &&
                        inseeCodes[0]?.value === inseeCode &&
                        numbers[0]?.value === parcelNumber)
                    }
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
                      // Fetch coordinates and city/address
                      let lat, lng, city;
                      try {
                        const utils = await import("./utils");
                        const coordsRes = await utils.getCoordinatesFromParcel(
                          inseeCode,
                          parcelNumber
                        );
                        if (coordsRes) {
                          lat = coordsRes.lat;
                          lng = coordsRes.lng;
                          // Try to fetch city/address from coordinates
                          try {
                            const resp = await fetch(
                              `https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`
                            );
                            const data = await resp.json();
                            if (
                              data.features &&
                              data.features[0] &&
                              data.features[0].properties
                            ) {
                              city = data.features[0].properties.city;
                            }
                          } catch {}
                        }
                      } catch {}
                      // Only show this parcel on the map (clear previous)
                      if (mapRef.current && parcelLayerId) {
                        const map = mapRef.current;
                        const parcelLayer = map
                          .getLayers()
                          .getArray()
                          .find(
                            layer =>
                              parcelLayerId &&
                              layer &&
                              layer.get &&
                              layer.get("ol_uid") == parcelLayerId
                          );
                        if (parcelLayer && parcelLayer.getSource) {
                          parcelLayer.getSource().clear();
                        }
                      }
                      const res = await addParcelToMap(
                        inseeCode,
                        parcelNumber,
                        mapRef.current,
                        parcelLayerId
                      );
                      if (res) {
                        // Append to the result list (allow multiple)
                        const newInseeCodes = [
                          ...inseeCodes,
                          { value: inseeCode, featureId: res.featureId }
                        ];
                        const newNumbers = [
                          ...numbers,
                          { value: parcelNumber }
                        ];
                        formik.setFieldValue(
                          `${prefix}InseeCodes`,
                          newInseeCodes
                        );
                        formik.setFieldValue(`${prefix}Numbers`, newNumbers);
                        setClientError(null);
                        if (onAddParcel) {
                          onAddParcel({
                            inseeCode,
                            parcelNumber,
                            lat,
                            lng,
                            city,
                            address: addressInput
                          });
                        }
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
                      value: coordinatesInput,
                      onChange: e => setCoordinatesInput(e.currentTarget.value)
                    }}
                  />
                </div>
                <div className={styles.gpsButtons}>
                  <Button
                    type="button"
                    priority="secondary"
                    disabled={disabled}
                    onClick={() => {
                      if (!coordinatesInput) {
                        setClientError({
                          text: "Affichage du point impossible : veuillez renseigner les coordonnées GPS",
                          severity: "error",
                          field: "coordinates"
                        });
                        return;
                      }
                      const res = displayCoordinates(
                        coordinatesInput,
                        mapRef.current
                      );
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
                      if (!coordinatesInput) {
                        setClientError({
                          text: "Ajout du point impossible : veuillez renseigner les coordonnées GPS",
                          severity: "error",
                          field: "coordinates"
                        });
                        return;
                      }
                      const lonLat =
                        lonLatFromCoordinatesString(coordinatesInput);
                      if (lonLat) {
                        const res = addPointToMap(
                          new Point(lonLat),
                          mapRef.current,
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
                        const newCoordinates = [
                          ...coordinates,
                          { value: coordinatesInput, featureId: res.featureId }
                        ];
                        formik.setFieldValue(
                          `${prefix}Coordinates`,
                          newCoordinates
                        );
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
                      status={null}
                      onDismiss={() => deleteParcel(parcel.mode, parcel.index)}
                      onTagClick={() => {
                        // Optionally implement display logic
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="fr-col-12 fr-col-md-6">
            <div ref={mapContainerRef} className={styles.map}></div>
          </div>
        </div>
      </div>
      {/* Optionally display errors */}
      {errors && typeof errors.coordinates === "string" && (
        <Alert
          className="fr-mt-2w"
          description={formatError(errors.coordinates)}
          severity="error"
          small
        />
      )}
    </div>
  );
}
