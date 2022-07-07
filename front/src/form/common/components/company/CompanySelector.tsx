import { useLazyQuery, useQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import { Field, useField, useFormikContext } from "formik";
import React, { useEffect, useCallback, useState } from "react";
import { checkVAT } from "jsvat";
import { IconSearch, IconLoading } from "common/components/Icons";
import { constantCase } from "constant-case";
import { InlineError, NotificationError } from "common/components/Error";
import RedErrorMessage from "common/components/RedErrorMessage";
import { COMPANY_INFOS } from "form/common/components/company/query";
import {
  isFRVat,
  isSiret,
  isVat,
  countries as vatCountries,
} from "generated/constants/companySearchHelpers";

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
  name: string;
  onCompanySelected?: (company: CompanyFavorite) => void;
  allowForeignCompanies?: boolean;
  // whether to display a vat searchbar when allowForeignCompanies==true
  forceManualForeignCompanyForm?: boolean;
  registeredOnlyCompanies?: boolean;
  heading?: string;
  disabled?: boolean;
  optionalMail?: boolean;
  skipFavorite?: boolean;
  // whether the company is optional
  optional?: boolean;
}

export default function CompanySelector({
  name,
  onCompanySelected,
  allowForeignCompanies = false,
  forceManualForeignCompanyForm = false, // used in order to allow foreign companies input without VAT search
  registeredOnlyCompanies = false,
  heading,
  disabled,
  optionalMail = false,
  skipFavorite = false,
  optional = false,
}: CompanySelectorProps) {
  const { siret } = useParams<{ siret: string }>();
  const [uniqId] = useState(() => uuidv4());
  const [field] = useField<FormCompany>({ name });
  const { setFieldError, setFieldValue, setFieldTouched } = useFormikContext();
  const [isForeignCompany, setIsForeignCompany] = useState(
    `${field.name}.country` !== "FR"
  );

  const [clue, setClue] = useState("");
  const [department, setDepartement] = useState<null | string>(null);
  const [searchResults, setSearchResults] = useState<CompanyFavorite[]>([]);
  // Queries
  /**
   * SearchCompanies allows to search by siret or text
   */
  const [
    searchCompaniesQuery,
    { loading: isLoadingSearch, data: searchData },
  ] = useLazyQuery<Pick<Query, "searchCompanies">, QuerySearchCompaniesArgs>(
    SEARCH_COMPANIES
  );
  // The favorite type is inferred from the name's prefix
  const favoriteType = constantCase(field.name.split(".")[0]) as FavoriteType;
  /**
   * favorites query
   */
  const {
    loading: isLoadingFavorites,
    data: favoritesData,
    error: favoritesError,
    refetch: refetchFavorites,
  } = useQuery<Pick<Query, "favorites">, QueryFavoritesArgs>(FAVORITES, {
    variables: {
      siret,
      type: favoriteType,
    },
    // Skip this query if the name's prefix is not a known favorite
    skip: !Object.values(FavoriteType).includes(favoriteType) || skipFavorite,
  });

  /**
   * searchCompany used currently only for VAT number exact match search
   */
  const [searchCompany, { loading: isLoadingCompany, error }] = useLazyQuery<
    Pick<Query, "companyInfos">
  >(COMPANY_INFOS, {
    onCompleted: data => {
      if (data?.companyInfos) {
        const companyInfos = data.companyInfos;
        if (!companyInfos.isRegistered && registeredOnlyCompanies) {
          cogoToast.error(
            "Cet établissement n'est pas enregistré sur Trackdéchets, nous ne pouvons l'ajouter dans ce formulaire"
          );
          setFieldError(
            `${field.name}.siret`,
            "Cet établissement n'est pas enregistré sur Trackdéchets, nous ne pouvons l'ajouter dans ce formulaire"
          );
          return;
        }
        if (companyInfos.name === "---") {
          cogoToast.error(
            "Cet établissement existe mais nous ne pouvons remplir automatiquement le formulaire"
          );
        }
        selectCompany(companyInfos as CompanyFavorite);
      } else {
        cogoToast.error("Aucun résultat pour votre recherche");
      }
    },
    fetchPolicy: "no-cache",
  });

  /**
   * Callback on company result click
   * for both searchCompanies by SIRET or name and searchCompany by VAT number
   */
  const selectCompany = useCallback(
    (company: CompanyFavorite | null) => {
      if (disabled) return;
      // empty the  selected company when null
      if (!company) {
        setFieldValue(field.name, {
          siret: "",
          name: "",
          vatNumber: "",
          address: "",
          contact: "",
          mail: "",
          phone: "",
          country: "",
        });
        return;
      }
      // avoid setting same company multiple times
      const fields = {
        siret: company.siret,
        vatNumber: company.vatNumber,
        name: company.name,
        address: company.address,
        contact: company.contact,
        phone: company.phone,
        mail: company.mail,
        country: company.codePaysEtrangerEtablissement,
      };

      // automatically set the country field
      if (company.vatNumber) {
        const vatCountryCode = checkVAT(company.vatNumber, vatCountries)
          ?.country?.isoCode.short;
        if (vatCountryCode) {
          fields.country = vatCountryCode;
        }
      }

      setIsForeignCompany(company.codePaysEtrangerEtablissement !== "FR");
      Object.keys(fields).forEach(key => {
        setFieldValue(`${field.name}.${key}`, fields[key]);
      });

      // callback to the parent component
      if (onCompanySelected) {
        onCompanySelected(company);
      }
    },
    [field.name, setFieldValue, onCompanySelected, disabled]
  );

  /**
   * Parse and merge data from searchCompanies and favoritesData
   */
  useEffect(() => {
    if (clue.length === 0) {
      // the result when emptying the search input
      return setSearchResults(favoritesData?.favorites ?? []);
    }
    setSearchResults(
      searchData?.searchCompanies
        .map(
          ({
            siret,
            vatNumber,
            name,
            address,
            transporterReceipt,
            traderReceipt,
            brokerReceipt,
            vhuAgrementDemolisseur,
            vhuAgrementBroyeur,
            codePaysEtrangerEtablissement,
            etatAdministratif,
          }) => {
            // exclude closed companies in SIRENE data
            if (etatAdministratif !== "A") return {};
            return {
              // convert CompanySearchResult to CompanyFavorite
              siret,
              vatNumber,
              name,
              address,
              transporterReceipt,
              traderReceipt,
              brokerReceipt,
              vhuAgrementDemolisseur,
              vhuAgrementBroyeur,
              codePaysEtrangerEtablissement: codePaysEtrangerEtablissement?.length
                ? codePaysEtrangerEtablissement
                : "FR",
              __typename: "CompanyFavorite",
              contact: "",
              phone: "",
              mail: "",
            } as CompanyFavorite;
          }
        )
        .filter(company => Object.keys(company).length > 0)
        // Concat user favorites companies, except the siret already in Search results
        .concat(
          favoritesData?.favorites?.filter(
            fav =>
              !searchData?.searchCompanies
                .map(company => company.siret)
                .includes(fav.siret)
          ) ?? []
        ) ??
        favoritesData?.favorites ??
        []
    );
  }, [searchData, favoritesData, clue.length]);

  /**
   * Force Selection of the first item if searchResults
   */
  useEffect(() => {
    if (!optional) {
      if (searchResults.length === 1 && field.value.siret === "") {
        selectCompany(searchResults[0]);
      }
    }
  }, [searchResults, field.value.siret, selectCompany, optional]);

  /**
   * Trigger search query with a delay
   * dispatch the right query depending on the value typed
   */
  useEffect(() => {
    const timeoutID = setTimeout(() => {
      if (clue.length === 0) {
        return refetchFavorites();
      }
      // no search for less than 4 characters
      if (clue.length < 3) {
        return;
      }
      const isValidSiret = isSiret(clue);
      const isValidVat = isVat(clue);
      const isTextSearch = !isValidSiret && !isValidVat;

      if (isValidSiret || isTextSearch) {
        setIsForeignCompany(false);
        setFieldValue(`${field.name}.vatNumber`, "");
        return searchCompaniesQuery({
          variables: {
            clue,
            department: department,
          },
        });
      } else if (!allowForeignCompanies) {
        // foreign companies search is not allowed
        return setFieldError(
          `${field.name}.siret`,
          "Vous devez entrer un numéro SIRET valide (14 chiffres) ou le nom d'une entreprise française"
        );
      }

      if (isValidVat && isFRVat(clue) && !forceManualForeignCompanyForm) {
        // FR VAT is not allowed
        return setFieldError(
          `${field.name}.siret`,
          "Vous devez identifier un établissement français par son numéro de SIRET (14 chiffres) et pas par son numéro de TVA"
        );
      }
      if (isValidVat && !forceManualForeignCompanyForm) {
        setIsForeignCompany(true);
        setFieldValue(`${field.name}.vatNumber`, clue);
        setFieldValue(`${field.name}.siret`, "");
        return searchCompany({
          variables: { siret: clue },
        });
      }
    }, 300);

    return () => {
      clearTimeout(timeoutID);
    };
  }, [
    clue,
    department,
    searchResults,
    allowForeignCompanies,
    field.name,
    forceManualForeignCompanyForm,
    refetchFavorites,
    searchCompaniesQuery,
    searchCompany,
    setFieldError,
    setFieldValue,
  ]);

  if (isLoadingFavorites) {
    return <p>Chargement...</p>;
  }

  if (favoritesError) {
    return <InlineError apolloError={favoritesError} />;
  }

  return (
    <>
      {error && (
        <NotificationError
          apolloError={error}
          message={error => {
            if (
              error.graphQLErrors.length &&
              error.graphQLErrors[0].extensions?.code === "FORBIDDEN"
            ) {
              return (
                "Nous n'avons pas pu récupérer les informations de cet établissement. " +
                "Veuillez nous contacter à l'adresse hello@trackdechets.beta.gouv.fr pour pouvoir procéder à la création de l'établissement"
              );
            }
            return error.message;
          }}
        />
      )}
      <div className="tw-my-6">
        {!!heading && <h4 className="form__section-heading">{heading}</h4>}
        <div className="tw-flex tw-justify-between">
          <div className="tw-w-1/2 tw-flex tw-flex-col tw-justify-between">
            <label htmlFor={`siret-${uniqId}`}>
              Nom ou numéro de SIRET de l'établissement
              {allowForeignCompanies && !forceManualForeignCompanyForm ? (
                <small className="tw-block">
                  ou numéro de TVA intracommunautaire pour les entreprises
                  étrangères
                </small>
              ) : (
                ""
              )}
            </label>
            <div className="tw-flex tw-items-center">
              <input
                id={`siret-${uniqId}`}
                type="text"
                className="td-input tw-w-2/3"
                onChange={event => {
                  setClue(event.target.value);
                }}
                onBlur={() => {
                  setFieldTouched(`${field.name}.siret`, true);
                  setFieldTouched(`${field.name}.vatNumber`, true);
                }}
                disabled={disabled}
              />
              <i className={styles.searchIcon} aria-label="Recherche">
                {isLoadingSearch || isLoadingFavorites || isLoadingCompany ? (
                  <IconLoading size="18px" />
                ) : (
                  <IconSearch size="16px" />
                )}
              </i>
            </div>
          </div>

          <div className="tw-w-1/4 tw-flex tw-flex-col tw-justify-between">
            <label htmlFor={`geo-${uniqId}`}>
              Département ou code postal
              <small className="tw-block">si l'entreprise est française</small>
            </label>

            <input
              id={`geo-${uniqId}`}
              type="text"
              className="td-input"
              onChange={event => setDepartement(event.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <RedErrorMessage name={`${field.name}.siret`} />

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

        <div className="form__row">
          {allowForeignCompanies &&
            (isForeignCompany || forceManualForeignCompanyForm) && (
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

                <RedErrorMessage name={`${field.name}.name`} />

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
            Mail {optionalMail ? "(optionnel)" : null}
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
    </>
  );
}
