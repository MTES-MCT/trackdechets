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
import {
  Query,
  QuerySearchCompaniesArgs,
  CompanySearchResult,
  FormCompany,
} from "../../generated/graphql/types";

type Action =
  | { type: "search_input"; payload: string }
  | { type: "department_filter"; payload: boolean }
  | { type: "department_input"; payload: string }
  | {
      type: "company_selected";
      payload: CompanySearchResult;
    };

interface CompanySelectorState {
  clue: string;
  department: string | null;
  displayDepartment: boolean;
  selectedCompany: CompanySearchResult;
}

interface CompanySelectorProps {
  name: string;
  onCompanySelected?: (company: CompanySearchResult) => void;
}

function getInitialState(initialCompany: FormCompany): CompanySelectorState {
  return {
    clue: "",
    department: null,
    displayDepartment: false,
    selectedCompany: {
      ...initialCompany,

      // Convert FormCompany to CompanySearchResult
      __typename: "CompanySearchResult",
      etatAdministratif: null,
      codeCommune: null,
      companyTypes: null,
      naf: null,
      libelleNaf: null,
      installation: null,
      transporterReceipt: null,
      traderReceipt: null,
    },
  };
}

function reducer(
  state: CompanySelectorState,
  action: Action
): CompanySelectorState {
  switch (action.type) {
    case "search_input":
      return {
        ...state,
        clue: action.payload,
      };
    case "department_filter":
      return {
        ...state,
        displayDepartment: action.payload,
      };
    case "department_input":
      return {
        ...state,
        department: action.payload,
      };
    case "company_selected":
      return {
        ...state,
        selectedCompany: action.payload,
      };
    default:
      return state;
  }
}

export default function CompanySelector({
  name,
  onCompanySelected,
}: CompanySelectorProps) {
  const [field] = useField<FormCompany>({ name });
  const { setFieldValue } = useFormikContext();
  const [state, dispatch] = useReducer(reducer, field.value, getInitialState);
  const [
    searchCompaniesQuery,
    { loading: isLoadingSearch, data: searchData },
  ] = useLazyQuery<Pick<Query, "searchCompanies">, QuerySearchCompaniesArgs>(
    SEARCH_COMPANIES
  );
  const {
    loading: isLoadingFavorites,
    data: favoritesData,
    error: favoritesError,
  } = useQuery<Pick<Query, "favorites">>(FAVORITES, {
    variables: {
      // Load different favorites depending on the object we are filling
      type: toMacroCase(field.name.split(".")[0]),
    },
  });

  const searchResults: CompanySearchResult[] =
    searchData?.searchCompanies ??
    favoritesData?.favorites?.map(favorite => ({
      ...favorite,

      // Convert CompanyFavorite to CompanySearchResult
      __typename: "CompanySearchResult",
      etatAdministratif: null,
      codeCommune: null,
      naf: null,
      libelleNaf: null,
      companyTypes: null,
      installation: null,
    })) ??
    [];

  useEffect(() => {
    if (searchResults.length === 1 && !state.selectedCompany.siret) {
      dispatch({
        type: "company_selected",
        payload: searchResults[0],
      });
    }
  }, [searchResults, state.selectedCompany.siret]);

  useEffect(() => {
    const timeoutID = setTimeout(() => {
      if (state.clue.length < 3) {
        return;
      }

      searchCompaniesQuery({
        variables: {
          clue: state.clue,
          department: state.department,
        },
      });
    }, 300);

    return () => {
      clearTimeout(timeoutID);
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

  useEffect(() => {
    if (onCompanySelected == null) {
      return;
    }

    onCompanySelected(state.selectedCompany);
  }, [state.selectedCompany, onCompanySelected]);

  if (isLoadingFavorites) {
    return <p>Chargement...</p>;
  }

  if (favoritesError) {
    return <InlineError apolloError={favoritesError} />;
  }

  return (
    <div className="CompanySelector form__group">
      <div className="search__group">
        <input
          type="text"
          placeholder="Recherche par numéro de SIRET ou nom de l'entreprise"
          className="company-selector__search"
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
        onClick={_ =>
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
              onChange={e =>
                dispatch({
                  type: "department_input",
                  payload: e.target.value,
                })
              }
            />
          </label>
        </div>
      )}

      {isLoadingSearch && <span>Chargement...</span>}

      <CompanyResults
        onSelect={company =>
          dispatch({ type: "company_selected", payload: company })
        }
        results={searchResults}
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
            className="company-selector__phone"
          />
        </label>

        <RedErrorMessage name={`${field.name}.phone`} />

        <label>
          Mail
          <Field
            type="email"
            name={`${field.name}.mail`}
            className="company-selector__email"
          />
        </label>

        <RedErrorMessage name={`${field.name}.mail`} />
      </div>
    </div>
  );
}
