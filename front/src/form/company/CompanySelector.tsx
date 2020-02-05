import { useQuery, useLazyQuery } from "@apollo/react-hooks";
import { Field, useField, useFormikContext } from "formik";
import React, { useEffect, useReducer } from "react";
import { FaCheck, FaRegCircle, FaSearch } from "react-icons/fa";
import RedErrorMessage from "../../common/RedErrorMessage";
import "./CompanySelector.scss";
import { FAVORITES, SEARCH_COMPANIES } from "./query";

export type Rubrique = {
  rubrique: string;
  alinea: string;
  category: string;
};

export type Company = {
  address: string;
  name: string;
  siret: string;
  naf: string;
  contact: string;
  phone: string;
  mail: string;
  installation: {
    codeS3ic: string;
    urlFiche: string;
    rubriques: Rubrique[];
  };
};

function init(selectedCompany) {
  return {
    clue: "",
    department: null,
    displayDepartment: false,
    searchLoading: false,
    searchResults: [],
    selectedCompany
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "search_input":
      return { ...state, clue: action.payload };
    case "department_filter":
      return { ...state, displayDepartment: action.payload };
    case "department_input":
      return { ...state, department: action.payload };
    case "search_change":
      return { ...state, ...action.payload };
    case "company_selected":
      return { ...state, selectedCompany: action.payload };
    case "reset":
      return init(action.payload);
    default:
      throw new Error();
  }
}

export default function CompanySelector(props) {
  const [field] = useField(props);
  const { setFieldValue } = useFormikContext();
  const [state, dispatch] = useReducer(reducer, field.value, init);
  const [
    searchCompaniesQuery,
    { loading: searchLoading, data: searchData }
  ] = useLazyQuery(SEARCH_COMPANIES);

  useEffect(() => {
    dispatch({
      type: "search_change",
      payload: {
        searchResults: searchData?.searchCompanies ?? [],
        searchLoading: searchLoading
      }
    });

    if (searchData?.searchCompanies.length === 1) {
      dispatch({
        type: "company_selected",
        payload: searchData.searchCompanies[0]
      });
    }
  }, [searchData, searchLoading]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!state.clue || state.clue.length < 1) {
        return;
      }
      const isNumber = /^[0-9\s]+$/.test(state.clue);
      if (isNumber && state.clue.length < 14) {
        return;
      }

      searchCompaniesQuery({
        variables: { clue: state.clue, department: state.department }
      });
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [state.clue, state.department, searchCompaniesQuery]);

  useEffect(() => {
    ["siret", "name", "address", "contact", "phone", "mail"].forEach(key => {
      if (!state.selectedCompany?.[key]) {
        return;
      }
      setFieldValue(`${field.name}.${key}`, state.selectedCompany[key]);
    });
  }, [state.selectedCompany, field.name, setFieldValue]);

  // Load different favorites depending on the object we are filling
  const type = field.name.split(".")[0].toUpperCase();

  const { loading, error, data } = useQuery(FAVORITES, {
    variables: { type },
    onCompleted: data =>
      state.selectedCompany.siret === ""
        ? dispatch({ type: "company_selected", payload: data.favorites[0] })
        : null
  });

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur :(</p>;

  return (
    <div className="CompanySelector">
      <div className="search__group">
        <input
          type="text"
          placeholder="Recherche par numéro de SIRET ou nom de l'entreprise"
          onChange={e =>
            dispatch({ type: "search_input", payload: e.target.value })
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
      <button
        className="button-outline small primary"
        type="button"
        onClick={e =>
          dispatch({
            type: "department_filter",
            payload: !state.displayDepartment
          })
        }
      >
        Affiner la recherche par département?
      </button>
      {state.displayDepartment && (
        <div className="form__group">
          <label>
            Département
            <input
              type="text"
              placeholder="Département ou code postal"
              onChange={e =>
                dispatch({
                  type: "department_input",
                  payload: parseInt(e.target.value, 10)
                })
              }
            />
          </label>
        </div>
      )}

      {state.searchLoading && <span>Chargement...</span>}
      <ul className="company-bookmarks">
        {[...state.searchResults, ...data.favorites].map(c => (
          <li
            className={`company-bookmarks__item  ${
              state.selectedCompany.siret === c.siret ? "is-selected" : ""
            }`}
            key={c.siret}
            onClick={() => dispatch({ type: "company_selected", payload: c })}
          >
            <div className="content">
              <h6>{c.name}</h6>
              <p>
                {c.siret} - {c.address}
              </p>
              <p>
                <a
                  href={`/company/${c.siret}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Information sur l'entreprise
                </a>
              </p>
            </div>
            <div className="icon">
              {state.selectedCompany.siret === c.siret ? (
                <FaCheck />
              ) : (
                <FaRegCircle />
              )}
            </div>
          </li>
        ))}
      </ul>

      <RedErrorMessage name={`${field.name}.siret`} />

      <div className="form__group">
        <label>
          Personne à contacter
          <Field
            type="text"
            name={`${field.name}.contact`}
            placeholder="NOM Prénom"
          />
        </label>

        <RedErrorMessage name={`${field.name}.contact`} />

        <label>
          Téléphone ou Fax
          <Field
            type="text"
            name={`${field.name}.phone`}
            placeholder="Numéro"
          />
        </label>

        <RedErrorMessage name={`${field.name}.phone`} />

        <label>
          Mail
          <Field type="email" name={`${field.name}.mail`} />
        </label>

        <RedErrorMessage name={`${field.name}.mail`} />
      </div>
    </div>
  );
}
