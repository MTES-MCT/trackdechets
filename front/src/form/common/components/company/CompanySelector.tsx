import { useLazyQuery, useQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import { Field, useField, useFormikContext } from "formik";
import React, { useEffect, useCallback, useMemo, useState } from "react";
import { checkVAT } from "jsvat";
import { IconSearch } from "common/components/Icons";
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
  CompanySearchResult,
} from "generated/graphql/types";
import CountrySelector from "./CountrySelector";
import { v4 as uuidv4 } from "uuid";
import { useParams } from "react-router-dom";
import AutoFormattingCompanyInfosInput from "common/components/AutoFormattingCompanyInfosInput";

interface CompanySelectorProps {
  name: string;
  onCompanySelected?: (company: CompanyFavorite) => void;
  allowForeignCompanies?: boolean;
  // whether to display a vat searchbar when allowForeignCompanies==true
  displayVatSearch?: boolean;
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
  allowForeignCompanies,
  displayVatSearch = true,
  registeredOnlyCompanies = false,
  heading,
  disabled,
  optionalMail = false,
  skipFavorite = false,
  optional = false,
}: CompanySelectorProps) {
  // STATE
  const [isRegistered, setIsRegistered] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [companyInfos, setCompanyInfos] = useState<CompanySearchResult | null>(
    null
  );
  const { siret } = useParams<{ siret: string }>();
  const [uniqId] = useState(() => uuidv4());
  const [field] = useField<FormCompany>({ name });
  const { setFieldError, setFieldValue, setFieldTouched } = useFormikContext();
  const { values } = useFormikContext<FormCompany>();
  const [clue, setClue] = useState("");
  const [department, setDepartement] = useState<null | string>(null);
  const [
    searchCompaniesQuery,
    { loading: isLoadingSearch, data: searchData },
  ] = useLazyQuery<Pick<Query, "searchCompanies">, QuerySearchCompaniesArgs>(
    SEARCH_COMPANIES
  );
  // The favorite type is inferred from the name's prefix
  const favoriteType = constantCase(field.name.split(".")[0]) as FavoriteType;
  const {
    loading: isLoadingFavorites,
    data: favoritesData,
    error: favoritesError,
  } = useQuery<Pick<Query, "favorites">, QueryFavoritesArgs>(FAVORITES, {
    variables: {
      siret,
      type: favoriteType,
    },
    // Skip this query if the name's prefix is not a known favorite
    skip: !Object.values(FavoriteType).includes(favoriteType) || skipFavorite,
  });

  const [searchCompany, { loading, error }] = useLazyQuery<
    Pick<Query, "companyInfos">
  >(COMPANY_INFOS, {
    onCompleted: data => {
      if (data?.companyInfos) {
        const companyInfos = data.companyInfos;
        if (!companyInfos.isRegistered && registeredOnlyCompanies) {
          cogoToast.error(
            "Cet établissement n'est pas enregistré sur Trackdéchets, nous ne pouvons l'ajouter dans ce formulaire"
          );
          return;
        }
        if (companyInfos.name === "---") {
          cogoToast.error(
            "Cet établissement existe mais nous ne pouvons remplir automatiquement le formulaire"
          );
        }
        setIsRegistered(companyInfos.isRegistered ?? false);
        setIsDisabled(!companyInfos.isRegistered);
        selectCompany(companyInfos as CompanyFavorite);
      }
    },
    fetchPolicy: "no-cache",
  });

  const selectCompany = useCallback(
    (company: CompanyFavorite) => {
      if (disabled) return;

      // avoid setting same company multiple times
      if (company?.siret && company.siret !== field.value.siret) {
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

        if (company.vatNumber) {
          const vatCountryCode = checkVAT(company.vatNumber, vatCountries)
            ?.country?.isoCode.short;
          if (vatCountryCode) {
            fields.country = vatCountryCode;
          }
        }

        Object.keys(fields).forEach(key => {
          setFieldValue(`${field.name}.${key}`, fields[key]);
        });
      } else if (optional) {
        // allow unselecting the company
        setFieldValue(field.name, {
          siret: "",
          name: "",
          address: "",
          contact: "",
          mail: "",
          phone: "",
        });
      }

      if (onCompanySelected) {
        onCompanySelected(company);
      }
    },
    [
      field.name,
      field.value.siret,
      setFieldValue,
      onCompanySelected,
      disabled,
      optional,
    ]
  );

  const searchResults: CompanyFavorite[] = useMemo(
    () =>
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
      [],
    [searchData, favoritesData]
  );

  useEffect(() => {
    if (!optional) {
      if (searchResults.length === 1 && field.value.siret === "") {
        selectCompany(searchResults[0]);
      }
    }
  }, [searchResults, field.value.siret, selectCompany, optional]);

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

  const isForeignCompany =
    field.value.siret == null ||
    (!!field.value.vatNumber &&
      !field.value.vatNumber.toUpperCase().startsWith("FR"));

  const onClickValidateForeignVat = () => {
    const { siret } = values;

    if (!siret) return;

    const isValidSiret = isSiret(siret);
    const isValidVat = isVat(siret);
    if (isValidSiret) {
      return setFieldError(
        "siret",
        "Vous devez entrer un numéro de TVA intra-communautaire hors-France"
      );
    } else if (isValidVat && isFRVat(siret)) {
      return setFieldError(
        "siret",
        "Vous devez identifier un établissement français par son numéro de SIRET (14 chiffres) et non son numéro de TVA"
      );
    } else if (!isValidVat) {
      return setFieldError(
        "siret",
        "Vous devez entrer un numéro TVA intra-communautaire valide"
      );
    }

    setCompanyInfos(null);
    searchCompany({
      variables: { siret: siret },
    });
  };

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
        <div className={styles.companySelectorSearchFields}>
          <div className={styles.companySelectorSearchGroup}>
            <label htmlFor={`siret-${uniqId}`}>
              Nom ou numéro de SIRET de l'entreprise
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

          {!isForeignCompany && (
            <>
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
            </>
          )}
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
              checked={isForeignCompany}
              disabled={disabled}
            />
            L'entreprise est à l'étranger
          </label>
        )}

        <div className="form__row">
          {isForeignCompany && (
            <>
              {displayVatSearch && (
                <div className={styles.companyForeignSelectorForm}>
                  <div className={styles.field}>
                    <label className={`text-right ${styles.bold}`}>
                      Numéro TVA pour un transporteur de l'UE hors-France
                    </label>
                    <div className={styles.field__value}>
                      <Field
                        name="siret"
                        component={AutoFormattingCompanyInfosInput}
                        onChange={e => {
                          setFieldValue("siret", e.target.value);
                        }}
                        disabled={isDisabled}
                      />
                      {!isRegistered && (
                        <p className="error-message">
                          Cet établissement n'est pas inscrit sur Trackdéchets
                        </p>
                      )}
                      <RedErrorMessage name="siret" />
                      <button
                        disabled={loading}
                        className="btn btn--primary tw-mt-2 tw-ml-1"
                        type="button"
                        onClick={onClickValidateForeignVat}
                      >
                        {loading ? "Chargement..." : "Chercher"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
