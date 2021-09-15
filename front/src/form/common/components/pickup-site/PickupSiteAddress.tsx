import React, { useEffect, useReducer } from "react";

import SearchInput from "common/components/SearchInput";
import styles from "./PickupSiteAddress.module.scss";
function init({ adress, city, postalCode }) {
  const selectedAdress = [adress, postalCode, city].filter(Boolean).join(" ");
  return {
    selectedAdress,
    searchInput: selectedAdress,
    searchResults: [],
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "search_input":
      return { ...state, searchInput: action.payload };
    case "search_done":
      return { ...state, searchResults: action.payload };
    case "select_address":
      return {
        ...state,
        selectedAdress: action.payload,
        searchInput: action.payload,
      };
  }
}

export default function PickupSiteAddress({
  adress,
  city,
  postalCode,
  onAddressSelection,
  designation,
  disabled = false,
}) {
  const [state, dispatch] = useReducer(
    reducer,
    { adress, city, postalCode },
    init
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!state.searchInput || state.searchInput === state.selectedAdress) {
        dispatch({ type: "search_done", payload: [] });
        return;
      }
      fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${state.searchInput}&type=housenumber&autocomplete=1`
      )
        .then(res => res.json())
        .then(res => dispatch({ type: "search_done", payload: res.features }));
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [state.searchInput, state.selectedAdress]);

  function selectAddress(feature) {
    onAddressSelection(feature.properties);
    dispatch({
      type: "select_address",
      payload: feature.properties.label,
    });
  }

  return (
    <div className="form__row">
      <label>Adresse {designation}</label>

      <SearchInput
        id="eco-search"
        placeholder="Recherchez une adresse puis sélectionnez un des choix qui apparait..."
        className={styles.worksiteSearchInput}
        onChange={e =>
          dispatch({ type: "search_input", payload: e.target.value })
        }
        value={state.searchInput}
        disabled={disabled}
      />

      {state.searchResults.map(feature => (
        <div
          className={styles.pickupSiteSearchResult}
          key={feature.properties.id}
          onClick={_ => selectAddress(feature)}
        >
          {feature.properties.label}
        </div>
      ))}
    </div>
  );
}
