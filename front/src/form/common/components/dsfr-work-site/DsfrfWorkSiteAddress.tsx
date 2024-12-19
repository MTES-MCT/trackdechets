import React, { useEffect, useReducer, useState } from "react";
import * as Sentry from "@sentry/browser";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import SearchInput from "../../../../Apps/common/Components/search/DsfrSearchInput";
import styles from "./WorkSiteAddress.module.scss";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { API_MIN_CHARS } from "../../constants";

export type GeoJsonProperties = {
  label: string;
  score: number;
  housenumber: string;
  id: string;
  type: string;
  name: string;
  postcode: string;
  citycode: string;
  x: number;
  y: number;
  city: string;
  context: string;
  importance: number;
  street: string;
};

type Feature = {
  type: "Feature";
  properties: GeoJsonProperties;
};

type State = {
  selectedAdress: string;
  searchInput: string;
  searchResults: Array<Feature>;
  address: string | null | undefined;
  postalCode: string | null | undefined;
  city: string | null | undefined;
};

type Action =
  | {
      type: "search_input";
      payload: string;
    }
  | {
      type: "search_done";
      payload: Array<Feature>;
    }
  | {
      type: "set_fields";
      payload: {
        address: string | null | undefined;
        postalCode: string | null | undefined;
        city: string | null | undefined;
      };
    }
  | {
      type: "select_address";
      payload: string;
    };
function init({ address, city, postalCode }) {
  const selectedAdress = [address, postalCode, city].filter(Boolean).join(" ");
  return {
    selectedAdress,
    searchInput: selectedAdress,
    searchResults: [],
    address,
    postalCode,
    city
  };
}

function reducer(state: State, action: Action) {
  switch (action.type) {
    case "search_input":
      return { ...state, searchInput: action.payload ?? [] };
    case "search_done":
      return { ...state, searchResults: action.payload ?? [] };
    case "set_fields":
      return {
        ...state,
        ...action.payload
      };
    case "select_address":
      return {
        ...state,
        selectedAdress: action.payload,
        searchInput: action.payload
      };
  }
}

export default function DsfrfWorkSiteAddress({
  address,
  city,
  postalCode,
  onAddressSelection,
  designation,
  disabled = false,
  placeholder = "Recherchez une adresse puis sélectionnez un des choix qui apparait..."
}: {
  address?: string;
  city?: string;
  postalCode?: string;
  designation?: string;
  disabled?: boolean;
  placeholder?: string;
  onAddressSelection: (selectedAddress: {
    name: string | null | undefined;
    city: string | null | undefined;
    postcode: string | null | undefined;
    label: string;
  }) => void;
}) {
  const [state, dispatch] = useReducer(
    reducer,
    { address, city, postalCode },
    init
  );

  const [showAdressFields, setShowAdressFields] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (
        !state.searchInput ||
        state.searchInput === state.selectedAdress ||
        state.searchInput.length < API_MIN_CHARS
      ) {
        dispatch({ type: "search_done", payload: [] });
        return;
      }
      fetch(`https://api-adresse.data.gouv.fr/search/?q=${state.searchInput}`)
        .then(res => res.json())
        .then(res => dispatch({ type: "search_done", payload: res.features }))
        .catch(error => {
          Sentry.captureException(error);
        });
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [state.searchInput, state.selectedAdress]);

  function selectAddress(feature) {
    onAddressSelection(feature.properties);
    dispatch({
      type: "select_address",
      payload: feature.properties.label
    });
  }
  function setManualAddress(payload: {
    address: string | null | undefined;
    city: string | null | undefined;
    postalCode: string | null | undefined;
  }) {
    const { city, address, postalCode } = payload;

    dispatch({
      type: "set_fields",
      payload: { city, address, postalCode }
    });

    // beware postCode/postalCode & name/address (former fields returned by address api)
    onAddressSelection({
      label: [address ?? "", postalCode ?? "", city ?? ""]
        .filter(Boolean)
        .join(" "),
      city: city,
      name: address,
      postcode: postalCode
    });
  }

  return (
    <div className="form__row">
      <label className="fr-label fr-mb-1w">Adresse {designation}</label>

      <SearchInput
        id="eco-search"
        placeholder={placeholder}
        className="fr-col-8 fr-mb-2w"
        onChange={e =>
          dispatch({ type: "search_input", payload: e.target.value })
        }
        value={state.searchInput}
        disabled={disabled || showAdressFields}
      />
      <ToggleSwitch
        inputTitle="showAdressFields"
        defaultChecked={false}
        showCheckedHint={false}
        className="fr-mb-2w"
        onChange={e => {
          setShowAdressFields(e);
        }}
        label={"Je veux entrer l'adresse manuellement"}
      />

      {showAdressFields && (
        <div className="fr-grid-row">
          <div className="fr-col-md-8 fr-mb-2w">
            <Input
              label="N° et libellé de voie ou lieu-dit"
              nativeInputProps={{
                defaultValue: address,
                onChange: e =>
                  setManualAddress({
                    city: state.city,
                    postalCode: state.postalCode,
                    address: e.target.value
                  })
              }}
            />
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top">
            <div className="fr-col-md-4">
              <Input
                label="Code postal"
                nativeInputProps={{
                  defaultValue: postalCode,
                  onChange: e =>
                    setManualAddress({
                      address: state.address,
                      city: state.city,
                      postalCode: e.target.value
                    })
                }}
              />
            </div>
            <div className="fr-col-md-8">
              <Input
                label="Ville"
                nativeInputProps={{
                  defaultValue: city,
                  onChange: e =>
                    setManualAddress({
                      address: state.address,
                      postalCode: state.postalCode,
                      city: e.target.value
                    })
                }}
              />
            </div>
          </div>
        </div>
      )}
      {state.searchResults?.map(feature => (
        <div
          className={styles.worksiteSearchResult}
          key={feature.properties.id}
          onClick={_ => selectAddress(feature)}
        >
          {feature.properties.label}
        </div>
      ))}
    </div>
  );
}
