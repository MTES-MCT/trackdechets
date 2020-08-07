import { useLazyQuery, useQuery } from "@apollo/react-hooks";
import { Field, useField, useFormikContext } from "formik";
import React, { useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { constantCase } from "constant-case";
import { InlineError } from "../../common/Error";
import RedErrorMessage from "../../common/RedErrorMessage";
import CompanyResults from "./CompanyResults";
import "./CompanySelector.scss";
import { FAVORITES, SEARCH_COMPANIES } from "./query";
import {
  Query,
  QuerySearchCompaniesArgs,
  CompanySearchResult,
  FormCompany,
  QueryFavoritesArgs,
  FavoriteType,
} from "../../generated/graphql/types";

interface CompanySelectorProps {
  name:
    | "nextDestination.company"
    | "destination.company"
    | "transporter.company"
    | "emitter.company"
    | "recipient.company"
    | "trader.company"
    | "temporaryStorageDetail.destination.company";
  onCompanySelected?: (company: CompanySearchResult) => void;
  allowForeignCountry?: boolean;
}

export default function CompanySelector({
  name,
  onCompanySelected,
  allowForeignCountry,
}: CompanySelectorProps) {
  const [field] = useField<FormCompany>({ name });
  const { setFieldValue } = useFormikContext();
  const [clue, setClue] = React.useState("");
  const [department, setDepartement] = React.useState<null | string>(null);
  // FIXME: selectedCompany is somewhat a duplicate of field.value and they're supposed to be synchronized
  const [selectedCompany, setSelectedCompany] = React.useState<
    CompanySearchResult
  >(() => ({
    ...field.value,

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
  }));
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
  } = useQuery<Pick<Query, "favorites">, QueryFavoritesArgs>(FAVORITES, {
    variables: {
      // Load different favorites depending on the object we are filling
      type: constantCase(field.name.split(".")[0]) as FavoriteType,
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
    if (searchResults.length === 1 && field.value.siret === "") {
      setSelectedCompany(searchResults[0]);
    }
  }, [searchResults, field.value.siret, setSelectedCompany]);

  useEffect(() => {
    const timeoutID = setTimeout(() => {
      if (clue.length < 3) {
        return;
      }

      searchCompaniesQuery({
        variables: {
          clue,
          department: department,
        },
      });
    }, 300);

    return () => {
      clearTimeout(timeoutID);
    };
  }, [clue, department, searchCompaniesQuery]);

  useEffect(() => {
    setFieldValue(`${field.name}.siret`, selectedCompany.siret);

    ["name", "address", "contact", "phone", "mail"].forEach(key => {
      if (!selectedCompany?.[key]) {
        return;
      }
      setFieldValue(`${field.name}.${key}`, selectedCompany[key]);
    });
  }, [selectedCompany, field.name, setFieldValue]);

  useEffect(() => {
    if (onCompanySelected == null) {
      return;
    }

    onCompanySelected(selectedCompany);
  }, [
    selectedCompany,
    // FIXME: onCompanySelected changes too often which freezes the page
    onCompanySelected,
  ]);

  if (isLoadingFavorites) {
    return <p>Chargement...</p>;
  }

  if (favoritesError) {
    return <InlineError apolloError={favoritesError} />;
  }

  return (
    <div className="CompanySelector form__group">
      {field.value.siret != null && (
        <>
          <div className="search__group">
            <input
              type="text"
              placeholder="Recherche par numéro de SIRET ou nom de l'entreprise"
              className="company-selector__search"
              onChange={event => setClue(event.target.value)}
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
            onClick={() => setDepartement(department == null ? "" : null)}
          >
            Affiner la recherche par département?
          </button>

          {department != null && (
            <div className="form__group">
              <label>
                Département
                <input
                  type="text"
                  placeholder="Département ou code postal"
                  onChange={event => setDepartement(event.target.value)}
                />
              </label>
            </div>
          )}

          {isLoadingSearch && <span>Chargement...</span>}

          <CompanyResults
            onSelect={company => setSelectedCompany(company)}
            results={searchResults}
            selectedItem={selectedCompany}
          />
        </>
      )}

      <RedErrorMessage name={`${field.name}.siret`} />

      {allowForeignCountry && (
        <label>
          <input
            type="checkbox"
            onChange={event => {
              setSelectedCompany({
                ...selectedCompany,
                siret: event.target.checked ? null : "",
              });
            }}
            checked={field.value.siret == null}
          />
          L'entreprise est à l'étranger
        </label>
      )}

      <div className="form__group">
        {field.value.siret == null && (
          <>
            <label>
              Nom de l'entreprise
              <Field
                type="text"
                name={`${field.name}.name`}
                placeholder="Nom"
              />
            </label>

            <RedErrorMessage name={`${field.name}.address`} />

            <label>
              Adresse de l'entreprise
              <Field
                type="text"
                name={`${field.name}.address`}
                placeholder="Adresse"
              />
            </label>

            <RedErrorMessage name={`${field.name}.address`} />

            <label>
              Pays de l'entreprise
              <Field
                type="text"
                name={`${field.name}.country`}
                placeholder="Pays"
              />
            </label>

            <RedErrorMessage name={`${field.name}.country`} />
          </>
        )}
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
