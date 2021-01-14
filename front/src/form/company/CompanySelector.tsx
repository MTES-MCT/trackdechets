import { useLazyQuery, useQuery } from "@apollo/client";
import { Field, useField, useFormikContext } from "formik";
import React, { useEffect, useCallback, useMemo, useState } from "react";
import { IconSearch } from "common/components/Icons";
import { constantCase } from "constant-case";
import { InlineError } from "common/components/Error";
import RedErrorMessage from "common/components/RedErrorMessage";
import CompanyResults from "./CompanyResults";
import styles from "./CompanySelector.module.scss";
import { FAVORITES, SEARCH_COMPANIES } from "./query";
import {
  Query,
  QuerySearchCompaniesArgs,
  FormCompany,
  QueryFavoritesArgs,
  FavoriteType,
  CompanyFavorite,
} from "generated/graphql/types";
import CountrySelector from "./CountrySelector";
import { v4 as uuidv4 } from "uuid";
import { useParams } from "react-router-dom";

interface CompanySelectorProps {
  name:
    | "nextDestination.company"
    | "destination.company"
    | "transporter.company"
    | "emitter.company"
    | "recipient.company"
    | "trader.company"
    | "broker.company"
    | "temporaryStorageDetail.destination.company"
    | "recipient.plannedBroyeurCompany";
  onCompanySelected?: (company: CompanyFavorite) => void;
  allowForeignCompanies?: boolean;
  heading?: string;
  disabled?: boolean;
}

export default function CompanySelector({
  name,
  onCompanySelected,
  allowForeignCompanies,
  heading,
  disabled,
}: CompanySelectorProps) {
  const { siret } = useParams<{ siret: string }>();
  const [uniqId] = useState(() => uuidv4());
  const [field] = useField<FormCompany>({ name });
  const { setFieldValue, setFieldTouched } = useFormikContext();
  const [clue, setClue] = useState("");
  const [department, setDepartement] = useState<null | string>(null);
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
      siret,
      // Load different favorites depending on the object we are filling
      type: constantCase(field.name.split(".")[0]) as FavoriteType,
    },
  });
  const selectCompany = useCallback(
    (company: CompanyFavorite) => {
      if (disabled) return;
      setFieldValue(`${field.name}.siret`, company.siret);

      const fields = {
        name: company.name,
        address: company.address,
        contact: company.contact,
        phone: company.phone,
        mail: company.mail,
      };
      Object.keys(fields)
        .filter(key => fields[key])
        .forEach(key => {
          setFieldValue(`${field.name}.${key}`, fields[key]);
        });

      if (onCompanySelected) {
        onCompanySelected(company);
      }
    },
    [field.name, setFieldValue, onCompanySelected, disabled]
  );

  const searchResults: CompanyFavorite[] = useMemo(
    () =>
      searchData?.searchCompanies.map(
        ({
          siret,
          name,
          address,
          transporterReceipt,
          traderReceipt,
          brokerReceipt,
          vhuAgrementDemolisseur,
          vhuAgrementBroyeur,
        }) => ({
          // convert CompanySearchResult to CompanyFavorite
          siret,
          name,
          address,
          transporterReceipt,
          traderReceipt,
          brokerReceipt,
          vhuAgrementDemolisseur,
          vhuAgrementBroyeur,

          __typename: "CompanyFavorite",
          contact: "",
          phone: "",
          mail: "",
        })
      ) ??
      favoritesData?.favorites ??
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
                  onBlur={() => setFieldTouched(`${field.name}.siret`, true)}
                  disabled={disabled}
                />
                <i className={styles.searchIcon} aria-label="Recherche">
                  <IconSearch size="12px" />
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
                disabled={disabled}
              />
            </div>
          </div>

          {isLoadingSearch && <span>Chargement...</span>}

          <CompanyResults
            onSelect={company => selectCompany(company)}
            results={searchResults}
            selectedItem={{
              ...field.value,

              // Convert FormCompany to CompanyFavorite
              __typename: "CompanyFavorite",
              transporterReceipt: null,
              traderReceipt: null,
              brokerReceipt: null,
              vhuAgrementBroyeur: null,
              vhuAgrementDemolisseur: null,
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
            disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
              />
            </label>

            <RedErrorMessage name={`${field.name}.address`} />

            <label>
              Pays de l'entreprise
              <Field name={`${field.name}.country`} disabled={disabled}>
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name={`${field.name}.mail`} />
      </div>
    </div>
  );
}
