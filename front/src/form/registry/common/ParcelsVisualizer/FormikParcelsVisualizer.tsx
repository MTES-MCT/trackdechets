import React, { useCallback, useEffect, useRef, useState } from "react";
import Alert, { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import clsx from "clsx";
import Gp from "geoportal-access-lib";
import { Map, MapBrowserEvent } from "ol";
import { Point } from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";
import "geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "ol/ol.css";

import styles from "./ParcelsVisualizer.module.scss";
import { ClickableTag } from "./ClickableTag";
import {
  getView,
  createMap,
  getParcel,
  lonLatFromCoordinatesString,
  addPointToMap,
  addParcelToMap,
  displayCoordinates,
  displayParcel,
  AddressSuggestion
} from "./utils";
import { AddressInput } from "./AddressInput";

/**
 * Data returned by the map when a parcel is selected.
 *
 * Cadastre mode: `inseeCode` + `parcelNumber` (format "prefix-section-number").
 * GPS mode: `x` (latitude) + `y` (longitude) in WGS 84.
 */
export type ParcelFromMap = {
  inseeCode: string;
  parcelNumber: string;
  /** Latitude (WGS 84) — for non-cadastered parcels */
  x?: number;
  /** Longitude (WGS 84) — for non-cadastered parcels */
  y?: number;
};

type FormikParcelsVisualizerProps = {
  disabled?: boolean;
  hideIfDisabled?: boolean;
  title?: string;
  /** Called when a parcel is added via the map or manual entry */
  onAddParcel: (parcel: ParcelFromMap) => void;
  /** Called when a parcel tag is dismissed */
  onRemoveParcel?: (index: number) => void;
  /** Labels to display as tags for currently selected parcels */
  tags?: string[];
};

enum Mode {
  CODE = "CODE",
  GPS = "GPS"
}

/**
 * A self-contained map component for selecting cadastral parcels.
 *
 * This component manages its own map lifecycle, user inputs for parcel code,
 * and click-on-map to reverse geocode. It does NOT manage Formik state
 * directly — it delegates to the parent via `onAddParcel` / `onRemoveParcel`.
 */
export function FormikParcelsVisualizer({
  disabled,
  hideIfDisabled = false,
  title,
  onAddParcel,
  onRemoveParcel,
  tags = []
}: FormikParcelsVisualizerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  const [clientError, setClientError] = useState<{
    text: string;
    severity: AlertProps.Severity;
    field: "inseeCode" | "parcelNumber" | "coordinates" | null;
  } | null>(null);
  const [mode, setMode] = useState<Mode>(Mode.CODE);
  const [markerLayerId, setMarkerLayerId] = useState<string | null>(null);
  const [parcelLayerId, setParcelLayerId] = useState<string | null>(null);
  const [coordinatesInput, setCoordinatesInput] = useState("");
  const [parcelNumber, setParcelNumber] = useState("");
  const [inseeCode, setInseeCode] = useState("");

  // ---------------------------------------------------------------------------
  // Map lifecycle
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (disabled && hideIfDisabled) return;
    if (!mapContainerRef.current || mapRef.current) return;

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
        }
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, hideIfDisabled]);

  // ---------------------------------------------------------------------------
  // Click-on-map: reverse geocode to get parcel info
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = async (e: MapBrowserEvent<MouseEvent>) => {
      if (disabled) return;

      const lonLat = toLonLat(e.coordinate);

      if (mode === Mode.CODE) {
        const parcel = await getParcel(lonLat[1], lonLat[0]);
        if (parcel) {
          setParcelNumber(parcel.parcelNumber);
          setInseeCode(parcel.inseeCode);
          setClientError(null);
          await addParcelToMap(
            parcel.inseeCode,
            parcel.parcelNumber,
            map,
            parcelLayerId
          );
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
        setCoordinatesInput(`${lonLat[1]} ${lonLat[0]}`);
      }
    };

    map.on("singleclick", handler);
    return () => {
      map.un("singleclick", handler);
    };
  }, [disabled, mode, parcelLayerId]);

  // ---------------------------------------------------------------------------
  // Address search: navigate map to address
  // ---------------------------------------------------------------------------
  const setSelectedAddress = useCallback((address: AddressSuggestion) => {
    if (mapRef.current) {
      mapRef.current.setView(
        getView(fromLonLat([address.lng, address.lat]), 11)
      );
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Display parcel on map (without adding to form)
  // ---------------------------------------------------------------------------
  const handleDisplayParcel = useCallback(async () => {
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

    const res = await displayParcel(inseeCode, parcelNumber, mapRef.current);
    if (!res) {
      setClientError({
        text: "Affichage de la parcelle impossible : les informations renseignées semblent incorrectes",
        severity: "warning",
        field: null
      });
      return;
    }
    setClientError(null);
  }, [inseeCode, parcelNumber]);

  // ---------------------------------------------------------------------------
  // Add parcel: display on map + notify parent
  // ---------------------------------------------------------------------------
  const handleAddParcel = useCallback(async () => {
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
      mapRef.current,
      parcelLayerId
    );
    if (!res) {
      setClientError({
        text: "Ajout de la parcelle impossible : les informations renseignées semblent incorrectes",
        severity: "warning",
        field: null
      });
      return;
    }

    setClientError(null);
    onAddParcel({ inseeCode, parcelNumber });
  }, [inseeCode, parcelNumber, parcelLayerId, onAddParcel]);

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
                      hintText="Préfixe-Section-Numéro"
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
                    onClick={handleDisplayParcel}
                  >
                    Afficher sur la carte
                  </Button>
                  <Button
                    type="button"
                    priority="secondary"
                    disabled={disabled}
                    onClick={handleAddParcel}
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
                      if (!lonLat) {
                        setClientError({
                          text: "Ajout du point impossible : les informations renseignées semblent incorrectes",
                          severity: "warning",
                          field: null
                        });
                        return;
                      }
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
                      setClientError(null);

                      // Parse raw lat/lng from input ("lat lng") and notify parent
                      const parts = coordinatesInput.trim().split(/\s+/);
                      const lat = Number(parts[0]);
                      const lng = Number(parts[1]);
                      onAddParcel({
                        inseeCode: "",
                        parcelNumber: "",
                        x: lat,
                        y: lng
                      });
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

            {tags.length > 0 && (
              <div className="fr-mt-1w">
                <div>Parcelles sélectionnées</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {tags.map((tag, idx) => (
                    <ClickableTag
                      key={`${tag}-${idx}`}
                      text={tag}
                      disabled={disabled}
                      status={null}
                      onDismiss={() => onRemoveParcel?.(idx)}
                      onTagClick={() => {
                        // noop
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="fr-col-12 fr-col-md-6">
            <div ref={mapContainerRef} className={styles.map} />
          </div>
        </div>
      </div>
    </div>
  );
}
