import { useLazyQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import { Field, useField, useFormikContext } from "formik";
import React, { useEffect, useCallback, useState } from "react";
import { checkVAT } from "jsvat";
import { IconSearch, IconLoading } from "common/components/Icons";
import { constantCase } from "constant-case";
import { InlineError, NotificationError } from "common/components/Error";
import RedErrorMessage from "common/components/RedErrorMessage";
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
  CompanySearchResult,
} from "generated/graphql/types";
import CountrySelector from "./CountrySelector";
import { v4 as uuidv4 } from "uuid";
import { useParams } from "react-router-dom";

interface CompanySelectorProps {
  name: string;
  onCompanySelected?: (company: CompanySearchResult) => void;
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
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  // Queries
  /**
   * SearchCompanies allows to search by siret or text
   */
  const [
    searchCompaniesQuery,
    { loading: isLoadingSearch, data: searchData, error },
  ] = useLazyQuery<Pick<Query, "searchCompanies">, QuerySearchCompaniesArgs>(
    SEARCH_COMPANIES
  );
  // The favorite type is inferred from the name's prefix
  const favoriteType = constantCase(field.name.split(".")[0]) as FavoriteType;
  /**
   * favorites query
   */
  const [
    favoritesQuery,
    { loading: isLoadingFavorites, data: favoritesData, error: favoritesError },
  ] = useLazyQuery<Pick<Query, "favorites">, QueryFavoritesArgs>(FAVORITES, {
    variables: {
      siret,
      type: favoriteType,
    },
  });

  /**
   * Selection d'un établissement dans le formulaire
   */
  const selectCompany = useCallback(
    (company: CompanySearchResult) => {
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
      if (!company.isRegistered && registeredOnlyCompanies) {
        cogoToast.error(
          "Cet établissement n'est pas inscrit sur Trackdéchets, nous ne pouvons l'ajouter dans ce formulaire"
        );
        setFieldError(
          `${field.name}.siret`,
          "Cet établissement n'est pas inscrit sur Trackdéchets, nous ne pouvons l'ajouter dans ce formulaire"
        );
        return;
      }
      // avoid setting same company multiple times
      const fields = {
        siret: company.siret,
        vatNumber: company.vatNumber,
        name: company.name,
        ...(company.name !== "---" && {
          address: company.address,
          contact: company.contact ?? "",
          phone: company.contactPhone ?? "",
          mail: company.contactEmail ?? "",
        }),
        country: company.codePaysEtrangerEtablissement,
      };
      if (company.name === "---") {
        cogoToast.error(
          "Cet établissement existe mais nous ne pouvons remplir automatiquement le formulaire"
        );
      }

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
    [
      field.name,
      setFieldValue,
      onCompanySelected,
      disabled,
      registeredOnlyCompanies,
      setFieldError,
    ]
  );

  /**
   * Selection automatique d'un résultat par défaut
   * ou signale l'absence de résultat de recherche
   */
  useEffect(() => {
    if (disabled) return;
    if (!optional) {
      // etat initial par défaut
      if (searchResults.length === 1 && field.value.siret === "") {
        selectCompany(searchResults[0]);
        return;
      }
      if (
        searchData?.searchCompanies.length === 1 &&
        (isVat(clue) || isSiret(clue))
      ) {
        // Selection du résultat de recherche exacte par SIRET ou TVA
        const foundCompany = searchResults.find(
          company =>
            company.siret === searchData.searchCompanies[0].siret ||
            company.vatNumber === searchData.searchCompanies[0].vatNumber
        );
        if (foundCompany) selectCompany(foundCompany);
      }
    }
  }, [
    disabled,
    searchResults,
    searchData,
    selectCompany,
    clue,
    optional,
    field.value.siret,
  ]);

  /**
   * Parse and merge data from searchCompanies and favoritesData
   */
  useEffect(() => {
    if (
      clue.length === 0 &&
      Object.values(FavoriteType).includes(favoriteType) &&
      !skipFavorite
    ) {
      // the result when emptying the search input or on first display
      setSearchResults(
        (favoritesData?.favorites as CompanySearchResult[]) ?? []
      );
      return;
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
            isRegistered,
            companyTypes,
            contactPhone,
            contactEmail,
            contact,
          }) =>
            ({
              // convert CompanySearchResult to form values
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
              __typename: "CompanySearchResult",
              contact,
              phone: contactPhone,
              mail: contactEmail,
              isRegistered,
              companyTypes,
              etatAdministratif,
            } as CompanySearchResult)
        )
        .filter(company => company.etatAdministratif === "A")
        // Concatener les favoris
        // Sauf doublons et sauf si l'input de recherche est un numéro de SIRET ou de TVA
        .concat(
          (favoritesData?.favorites?.filter(
            fav =>
              !searchData?.searchCompanies
                .map(company => company.siret)
                .includes(fav.siret) &&
              !searchData?.searchCompanies
                .map(company => company.vatNumber)
                .includes(fav.vatNumber)
          ) as CompanySearchResult[]) ?? []
        ) ??
        (favoritesData?.favorites as CompanySearchResult[]) ??
        []
    );
  }, [
    searchData,
    favoritesData,
    clue.length,
    setSearchResults,
    favoriteType,
    skipFavorite,
  ]);

  /**
   * Démarre la requete avec un délai
   */
  useEffect(() => {
    const timeoutID = setTimeout(() => {
      if (clue.length === 0 && !skipFavorite) {
        return favoritesQuery();
      }
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
      }

      if (isValidVat) {
        if (allowForeignCompanies && !forceManualForeignCompanyForm) {
          if (isFRVat(clue)) {
            return setFieldError(
              `${field.name}.siret`,
              "Vous devez identifier un établissement français par son numéro de SIRET (14 chiffres) et pas par son numéro de TVA"
            );
          } else {
            setIsForeignCompany(true);
            setFieldValue(`${field.name}.vatNumber`, clue);
            setFieldValue(`${field.name}.siret`, "");
            return searchCompaniesQuery({
              variables: {
                clue,
              },
            });
          }
        }
      }
      return setFieldError(
        `${field.name}.siret`,
        "Vous devez entrer un numéro SIRET valide (14 chiffres) ou le nom d'une entreprise française"
      );
    }, 300);

    return () => {
      clearTimeout(timeoutID);
    };
  }, [
    clue,
    department,
    setIsForeignCompany,
    setFieldValue,
    searchCompaniesQuery,
    setFieldError,
    allowForeignCompanies,
    favoritesQuery,
    field.name,
    forceManualForeignCompanyForm,
    skipFavorite,
  ]);

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
                "Nous n'avons pas pu récupérer les informations." +
                "Veuillez nous contacter à l'adresse contact@trackdechets.beta.gouv.fr pour pouvoir procéder à la création de l'établissement"
              );
            }
            return error.message;
          }}
        />
      )}
      <div className="tw-my-6">
        {!!heading && <h4 className="form__section-heading">{heading}</h4>}
        <div className="tw-flex tw-justify-between">
          <div className="tw-w-3/4 tw-flex tw-flex-col tw-justify-between">
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
            <div className="tw-flex tw-items-center tw-mr-4">
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
                {isLoadingSearch || isLoadingFavorites ? (
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

        <CompanyResults<CompanySearchResult>
          onSelect={company => selectCompany(company)}
          results={searchResults}
          selectedItem={{
            ...(field.value as CompanySearchResult),
            __typename: "CompanySearchResult",
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
