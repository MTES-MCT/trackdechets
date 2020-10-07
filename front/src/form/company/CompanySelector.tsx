import { useLazyQuery, useQuery } from "@apollo/react-hooks";
import { Field, useField, useFormikContext } from "formik";
import React, { useEffect, useCallback, useMemo, useState } from "react";
import { Search } from "src/common/components/Icons";
import { constantCase } from "constant-case";
import { InlineError } from "src/common/components/Error";
import RedErrorMessage from "src/common/components/RedErrorMessage";
import CompanyResults from "./CompanyResults";
import styles from "./CompanySelector.module.scss";
import { FAVORITES, SEARCH_COMPANIES } from "./query";
import {
  Query,
  QuerySearchCompaniesArgs,
  CompanySearchResult,
  FormCompany,
  QueryFavoritesArgs,
  FavoriteType,
} from "../../generated/graphql/types";
import CountrySelector from "./CountrySelector";
import { v4 as uuidv4 } from "uuid";
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
  allowForeignCompanies?: boolean;
  heading?: string;
}

export default function CompanySelector({
  name,
  onCompanySelected,
  allowForeignCompanies,
  heading,
}: CompanySelectorProps) {
  const [uniqId] = useState(() => uuidv4());
  const [field] = useField<FormCompany>({ name });
  const { setFieldValue } = useFormikContext();
  const [clue, setClue] = React.useState("");
  const [department, setDepartement] = React.useState<null | string>(null);
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
  const selectCompany = useCallback(
    (company: CompanySearchResult) => {
      setFieldValue(`${field.name}.siret`, company.siret);

      ["name", "address", "contact", "phone", "mail"].forEach(key => {
        if (!company?.[key]) {
          return;
        }
        setFieldValue(`${field.name}.${key}`, company[key]);
      });

      if (onCompanySelected) {
        onCompanySelected(company);
      }
    },
    [field.name, setFieldValue, onCompanySelected]
  );

  const searchResults: CompanySearchResult[] = useMemo(
    () =>
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
      [],
    [searchData, favoritesData]
  );

  useEffect(() => {
    if (searchResults.length === 1 && field.value.siret === "") {
      selectCompany(searchResults[0]);
    }
  }, [searchResults, field.value.siret, selectCompany]);

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

  if (isLoadingFavorites) {
    return <p>Chargement...</p>;
  }

  if (favoritesError) {
    return <InlineError apolloError={favoritesError} />;
  }

  return (
    <div className="tw-my-6">
      {!!heading && <h4 className="form__section-heading">{heading}</h4>}
      {field.value.siret != null && (
        <>
          <div className={styles.companySelectorSearchFields}>
            <div className={styles.companySelectorSearchGroup}>
              <label htmlFor={`siret-${uniqId}`}>
                Numéro de SIRET ou nom de l'entreprise
              </label>
              <div className={styles.companySelectorSearchField}>
                <input
                  id={`siret-${uniqId}`}
                  type="text"
                  className={`td-input ${styles.companySelectorSearchSiret}`}
                  onChange={event => setClue(event.target.value)}
                />
                <i className={styles.searchIcon} aria-label="Recherche">
                  <Search color="#8393a7" size={12} />
                </i>
              </div>
            </div>

            <div className={styles.companySelectorSearchGroup}>
              <label htmlFor={`geo-${uniqId}`}>
                Département ou code postal
              </label>

              <input
                id={`geo-${uniqId}`}
                type="text"
                className={`td-input ${styles.companySelectorSearchGeo}`}
                onChange={event => setDepartement(event.target.value)}
              />
            </div>
          </div>

          {isLoadingSearch && <span>Chargement...</span>}

          <CompanyResults
            onSelect={company => selectCompany(company)}
            results={searchResults}
            selectedItem={{
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
            }}
          />
        </>
      )}

      <RedErrorMessage name={`${field.name}.siret`} />

      {allowForeignCompanies && (
        <label>
          <input
            type="checkbox"
            className="td-checkbox"
            onChange={event => {
              setFieldValue(
                `${field.name}.siret`,
                event.target.checked ? null : ""
              );
            }}
            checked={field.value.siret == null}
          />
          L'entreprise est à l'étranger
        </label>
      )}

      <div className="form__row">
        {field.value.siret == null && (
          <>
            <label>
              Nom de l'entreprise
              <Field
                type="text"
                className="td-input"
                name={`${field.name}.name`}
                placeholder="Nom"
              />
            </label>

            <RedErrorMessage name={`${field.name}.address`} />

            <label>
              Adresse de l'entreprise
              <Field
                type="text"
                className="td-input"
                name={`${field.name}.address`}
                placeholder="Adresse"
              />
            </label>

            <RedErrorMessage name={`${field.name}.address`} />

            <label>
              Pays de l'entreprise
              <Field name={`${field.name}.country`}>
                {({ field, form }) => (
                  <CountrySelector
                    {...field}
                    onChange={code => form.setFieldValue(field.name, code)}
                    value={field.value}
                    placeholder="Pays"
                  />
                )}
              </Field>
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
            className="td-input"
          />
        </label>

        <RedErrorMessage name={`${field.name}.contact`} />
      </div>
      <div className="form__row">
        <label>
          Téléphone ou Fax
          <Field
            type="text"
            name={`${field.name}.phone`}
            placeholder="Numéro"
            className={`td-input ${styles.companySelectorSearchPhone}`}
          />
        </label>

        <RedErrorMessage name={`${field.name}.phone`} />
      </div>
      <div className="form__row">
        <label>
          Mail
          <Field
            type="email"
            name={`${field.name}.mail`}
            className={`td-input ${styles.companySelectorSearchEmail}`}
          />
        </label>

        <RedErrorMessage name={`${field.name}.mail`} />
      </div>
    </div>
  );
}
