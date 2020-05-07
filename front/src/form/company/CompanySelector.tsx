import { useLazyQuery, useQuery } from "@apollo/react-hooks";
import { Field, useField, useFormikContext } from "formik";
import React, { useEffect, useReducer } from "react";
import { FaSearch } from "react-icons/fa";
import { InlineError } from "../../common/Error";
import { toMacroCase } from "../../common/helper";
import RedErrorMessage from "../../common/RedErrorMessage";
import CompanyResults from "./CompanyResults";
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
    selectedCompany,
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
    { loading: searchLoading, data: searchData },
  ] = useLazyQuery(SEARCH_COMPANIES);

  useEffect(() => {
    dispatch({
      type: "search_change",
      payload: {
        searchResults: searchData?.searchCompanies ?? [],
        searchLoading,
      },
    });

    if (searchData?.searchCompanies?.length === 1) {
      dispatch({
        type: "company_selected",
        payload: searchData.searchCompanies[0],
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
        variables: { clue: state.clue, department: state.department },
      });
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [state.clue, state.department, searchCompaniesQuery]);

  useEffect(() => {
    ["siret", "name", "address", "contact", "phone", "mail"].forEach((key) => {
      if (!state.selectedCompany?.[key]) {
        return;
      }
      setFieldValue(`${field.name}.${key}`, state.selectedCompany[key]);
    });
  }, [state.selectedCompany, field.name, setFieldValue]);

  // Load different favorites depending on the object we are filling
  const type = toMacroCase(field.name.split(".")[0]);

  const { loading, error } = useQuery(FAVORITES, {
    variables: { type },
    onCompleted: (data) => {
      if (state.selectedCompany.siret === "") {
        dispatch({ type: "company_selected", payload: data.favorites[0] });
      }
      dispatch({
        type: "search_change",
        payload: {
          searchResults: data.favorites,
        },
      });
    },
  });

  if (loading) return <p>Chargement...</p>;
  if (error) return <InlineError apolloError={error} />;

  return (
    <div className="CompanySelector form__group">
      <div className="search__group">
        <input
          type="text"
          placeholder="Recherche par numéro de SIRET ou nom de l'entreprise"
          onChange={(e) =>
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
        onClick={(_) =>
          dispatch({
            type: "department_filter",
            payload: !state.displayDepartment,
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
              onChange={(e) =>
                dispatch({
                  type: "department_input",
                  payload: e.target.value,
                })
              }
            />
          </label>
        </div>
      )}

      {state.searchLoading && <span>Chargement...</span>}
      <CompanyResults
        onSelect={(company) =>
          dispatch({ type: "company_selected", payload: company })
        }
        results={[
          ...state.searchResults,
          ...(!state.searchResults.some(
            (c) => c.siret === state.selectedCompany.siret
          )
            ? [state.selectedCompany]
            : []),
        ]}
        selectedItem={state.selectedCompany}
      />

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
