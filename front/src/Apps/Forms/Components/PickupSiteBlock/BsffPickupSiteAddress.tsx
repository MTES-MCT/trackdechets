import React, { useEffect, useState } from "react";
import * as Sentry from "@sentry/browser";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { API_MIN_CHARS } from "../../../../form/common/constants";
import { requiredAria, requiredLabel } from "../RequiredField/requiredField";
import styles from "./BsffPickupSiteAddress.module.scss";
import type { BsffPickupSite } from "./types";

type GeoJsonProperties = {
  id: string;
  label: string;
  name: string;
  postcode: string;
  city: string;
};

type Feature = { properties: GeoJsonProperties };
type BsffPickupSiteValue = Pick<
  BsffPickupSite,
  "address" | "addressComplement" | "postalCode" | "city"
>;

type FieldError = { message?: string };

type Props = {
  site: BsffPickupSiteValue;
  manual: boolean;
  disabled?: boolean;
  errors?: Partial<Record<keyof BsffPickupSiteValue, FieldError>>;
  onManualChange: (manual: boolean) => void;
  onChange: (field: keyof BsffPickupSiteValue, value: string | null) => void;
};

export default function BsffPickupSiteAddress({
  site,
  manual,
  disabled = false,
  errors,
  onManualChange,
  onChange
}: Readonly<Props>) {
  const formattedAddress = [site.address, site.postalCode, site.city]
    .filter(Boolean)
    .join(" ");
  const [searchInput, setSearchInput] = useState(formattedAddress);
  const [selectedAddress, setSelectedAddress] = useState(formattedAddress);
  const [results, setResults] = useState<Feature[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      if (
        manual ||
        !searchInput ||
        searchInput === selectedAddress ||
        searchInput.length < API_MIN_CHARS
      ) {
        setResults([]);
        return;
      }
      fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
          searchInput
        )}`,
        { signal: controller.signal }
      )
        .then(response => {
          if (!response.ok) throw new Error("Échec de la recherche d'adresse");
          return response.json();
        })
        .then((response: { features?: Feature[] }) =>
          setResults(response.features ?? [])
        )
        .catch(error => {
          if (error.name !== "AbortError") Sentry.captureException(error);
        });
    }, 300);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [manual, searchInput, selectedAddress]);

  const selectAddress = (properties: GeoJsonProperties) => {
    setSearchInput(properties.label);
    setSelectedAddress(properties.label);
    setResults([]);
    onChange("address", properties.name);
    onChange("postalCode", properties.postcode);
    onChange("city", properties.city);
  };

  return (
    <div className="form__row">
      <label className="fr-label fr-mb-1w">
        {requiredLabel("Adresse de collecte", !manual)}
      </label>
      <SearchBar
        className={`${styles.searchInput} fr-mb-2w`}
        renderInput={({ className, id, type }) => (
          <input
            className={className}
            id={id}
            type={type}
            aria-label="Adresse de collecte"
            {...requiredAria(!manual)}
            placeholder="Recherchez une adresse puis sélectionnez un choix"
            value={searchInput}
            disabled={disabled || manual}
            onChange={event => setSearchInput(event.target.value)}
          />
        )}
      />
      {results.map(feature => (
        <button
          type="button"
          className={styles.searchResult}
          key={feature.properties.id}
          onClick={() => selectAddress(feature.properties)}
        >
          {feature.properties.label}
        </button>
      ))}
      {!manual && errors?.address?.message && (
        <p className="fr-error-text">{errors.address.message}</p>
      )}

      <ToggleSwitch
        inputTitle="Saisie manuelle de l'adresse"
        checked={manual}
        disabled={disabled}
        className="fr-mb-2w"
        onChange={onManualChange}
        label="Je veux entrer l'adresse manuellement"
      />

      {manual && (
        <div className="fr-grid-row">
          <div className="fr-col-md-8 fr-mb-2w">
            <Input
              label={requiredLabel("N° et libellé de voie ou lieu-dit", true)}
              disabled={disabled}
              nativeInputProps={{
                value: site.address ?? "",
                onChange: event => onChange("address", event.target.value),
                ...requiredAria(true)
              }}
              state={errors?.address ? "error" : "default"}
              stateRelatedMessage={errors?.address?.message}
            />
          </div>
          <div className="fr-col-md-8 fr-mb-2w">
            <Input
              label="Complément d'adresse"
              disabled={disabled}
              nativeInputProps={{
                value: site.addressComplement ?? "",
                onChange: event =>
                  onChange("addressComplement", event.target.value),
                ...requiredAria(false)
              }}
            />
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top">
            <div className="fr-col-md-4">
              <Input
                label={requiredLabel("Code postal", true)}
                disabled={disabled}
                nativeInputProps={{
                  value: site.postalCode ?? "",
                  onChange: event => onChange("postalCode", event.target.value),
                  ...requiredAria(true)
                }}
                state={errors?.postalCode ? "error" : "default"}
                stateRelatedMessage={errors?.postalCode?.message}
              />
            </div>
            <div className="fr-col-md-8">
              <Input
                label={requiredLabel("Commune", true)}
                disabled={disabled}
                nativeInputProps={{
                  value: site.city ?? "",
                  onChange: event => onChange("city", event.target.value),
                  ...requiredAria(true)
                }}
                state={errors?.city ? "error" : "default"}
                stateRelatedMessage={errors?.city?.message}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
