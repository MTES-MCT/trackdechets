import { useQuery } from "@apollo/react-hooks";
import { useField, useFormikContext } from "formik";
import gql from "graphql-tag";
import React, { useEffect, useReducer } from "react";
import { FaSearch } from "react-icons/fa";
import CompanyResults from "../company/CompanyResults";
import styles from "./EcoOrganismes.module.scss";
import { Query, EcoOrganisme } from "../../generated/graphql/types";

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

function init(
  selectedOrganismeId: string | null,
  isActive = !!selectedOrganismeId,
  ecoOrganismes = []
) {
  return {
    isActive,
    ecoOrganismes,
    searchClue: "",
    selectedOrganismeId,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "toggle_activation":
      return init(null, !state.isActive, state.ecoOrganismes);
    case "select":
      return {
        ...state,
        selectedOrganismeId: action.payload,
      };
    case "fetch":
      return { ...state, ecoOrganismes: action.payload };
    case "search":
      return {
        ...state,
        searchClue: action.payload.toLowerCase(),
      };
  }
}

export default function EcoOrganismes(props) {
  const [field] = useField(props);
  const { setFieldValue } = useFormikContext();
  const [state, dispatch] = useReducer(reducer, field.value?.id, init);

  const { loading, error, data } = useQuery<Pick<Query, "ecoOrganismes">>(
    GET_ECO_ORGANISMES
  );

  useEffect(() => {
    if (data?.ecoOrganismes) {
      dispatch({ type: "fetch", payload: data.ecoOrganismes });
    }
  }, [data]);

  useEffect(() => {
    setFieldValue(
      field.name,
      state.selectedOrganismeId ? { id: state.selectedOrganismeId } : null
    );
  }, [state.selectedOrganismeId, field.name, setFieldValue]);

  return (
    <>
      <div className="form__group">
        <label>
          <input
            type="checkbox"
            checked={state.isActive}
            onChange={() => dispatch({ type: "toggle_activation" })}
          />
          Un éco-organisme est le responsable / producteur des déchets de ce
          bordereau
        </label>
      </div>

      {state.isActive && (
        <>
          {loading && <p>Chargement...</p>}
          {error && <p>Erreur lors du chargement des éco-organismes...</p>}
          {data && (
            <>
              <div className="form__group notification info">
                Veuillez sélectionner ci-dessous un des éco-organismes
                enregistrés dans Trackdéchets. Si votre éco-organisme n'apparait
                pas et que vous pensez que c'est une erreur,{" "}
                <a href="mailto:emmanuel.flahaut@developpement-durable.gouv.fr">
                  contactez le support.
                </a>
              </div>

              <div className="form__group search__group">
                <input
                  type="text"
                  placeholder="Filtrer les éco-organismes par nom..."
                  onChange={e =>
                    dispatch({
                      type: "search",
                      payload: e.target.value.toLowerCase(),
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
                <CompanyResults<EcoOrganisme>
                  onSelect={eo => dispatch({ type: "select", payload: eo.id })}
                  results={state.ecoOrganismes.filter(eo =>
                    eo.name.toLowerCase().includes(state.searchClue)
                  )}
                  selectedItem={state.ecoOrganismes.find(
                    eo => eo.id === state.selectedOrganismeId
                  )}
                />
              </div>
            </>
          )}

          <div className="notification warning">
            Indiquez dans la partie <strong>"Entreprise émettrice"</strong>{" "}
            ci-dessous l'entreprise du lieu de collecte et son SIRET.
            L'Eco-organisme est bien identifié comme responsable du déchet.
            <br />
            Vous pouvez utiliser la case <strong>
              Adresse de chantier
            </strong>{" "}
            tout en bas si le lieu réel de collecte est différent de l'adresse
            de l'entreprise (exemple SIRET / adresse communauté de communes pour
            l'entreprise émettrice, et adresse dechetterie pour lieu de
            collecte.)
          </div>
        </>
      )}
    </>
  );
}
