import { useQuery } from "@apollo/react-hooks";
import { useField, useFormikContext } from "formik";
import gql from "graphql-tag";
import React, { useEffect, useReducer } from "react";
import { FaSearch } from "react-icons/fa";
import CompanyResults from "../company/CompanyResults";
import styles from "./EcoOrganismes.module.scss";

const GET_ECO_ORGANISMES = gql`
  {
    ecoOrganismes {
      id
      name
      siret
      address
    }
  }
`;

function reducer(state, action) {
  switch (action.type) {
    case "toggle_activation":
      return { ...state, active: !state.active };
    case "select":
      return {
        ...state,
        selectedOrganisme: state.ecoOrganismes.find(
          eo => eo.id === action.payload
        )
      };
    case "fetch":
      return { ...state, ecoOrganismes: action.payload };
    case "search":
      return {
        ...state,
        searchClue: action.payload,
        filteredEcoOrganismes: state.ecoOrganismes.filter(
          eo => eo.name.toLowerCase().indexOf(action.payload) > -1
        )
      };
  }
}

export default function EcoOrganismes(props) {
  const [field] = useField(props);
  const { setFieldValue } = useFormikContext();
  const [state, dispatch] = useReducer(reducer, {
    active: !!field.value,
    ecoOrganismes: [],
    filteredEcoOrganismes: [],
    searchClue: "",
    selectedOrganisme: null
  });

  const { loading, error, data } = useQuery(GET_ECO_ORGANISMES);

  useEffect(() => {
    if (data?.ecoOrganismes) {
      dispatch({ type: "fetch", payload: data.ecoOrganismes });
      dispatch({ type: "search", payload: "" });
    }
  }, [data]);

  useEffect(() => {
    if (field.value) {
      dispatch({ type: "select", payload: field.value });
    }
  }, [data, field.value]);

  return (
    <>
      <h4>Eco-organisme ?</h4>
      <div className="form__group">
        <label>
          <input
            type="checkbox"
            checked={state.active}
            onChange={() => dispatch({ type: "toggle_activation" })}
          />
          Un éco-organisme est le responsable / producteur des déchets de ce
          bordereau
        </label>
      </div>

      {state.active && (
        <>
          {loading && <p>Chargement...</p>}
          {error && <p>Erreur lors du chargement des éco-organismes...</p>}
          {data && (
            <>
              <div className="form__group search__group">
                <input
                  type="text"
                  placeholder="Recherche d'un éco-organisme par nom..."
                  onChange={e =>
                    dispatch({
                      type: "search",
                      payload: e.target.value.toLowerCase()
                    })
                  }
                />
                <button
                  className="overlay-button search-icon"
                  aria-label="Recherche"
                  disabled={true}
                >
                  <FaSearch />
                </button>
              </div>
              <div className={styles.list}>
                <CompanyResults
                  onSelect={eo => setFieldValue(field.name, eo.id)}
                  results={state.filteredEcoOrganismes}
                  selectedItem={state.selectedOrganisme}
                />
              </div>
            </>
          )}

          <div className="notification warning">
            Blabla explcatif ici Remplissez dans la partie{" "}
            <strong>"Entreprise émettrice"</strong> ci-dessous les informations
            sur l'entreprise de collecte.
          </div>
        </>
      )}
    </>
  );
}
