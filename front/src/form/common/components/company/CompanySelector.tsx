import { useLazyQuery, useQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import { Field, useField, useFormikContext } from "formik";
import React, { useRef, useEffect, useCallback, useState } from "react";
import { checkVAT } from "jsvat";
import { IconSearch, IconLoading } from "common/components/Icons";
import { constantCase } from "constant-case";
import {
  NotificationError,
  SimpleNotificationError,
} from "common/components/Error";
import RedErrorMessage from "common/components/RedErrorMessage";
import {
  isFRVat,
  isSiret,
  isVat,
  countries as vatCountries,
} from "generated/constants/companySearchHelpers";

import CompanyResults, { isSelected } from "./CompanyResults";
import styles from "./CompanySelector.module.scss";
import {
  FAVORITES,
  SEARCH_COMPANIES,
  COMPANY_SELECTOR_PRIVATE_INFOS,
} from "./query";
import {
  Query,
  QuerySearchCompaniesArgs,
  FormCompany,
  QueryFavoritesArgs,
  FavoriteType,
  CompanySearchResult,
  CompanyFavorite,
  QueryCompanyPrivateInfosArgs,
} from "generated/graphql/types";
import CountrySelector from "./CountrySelector";
import { v4 as uuidv4 } from "uuid";
import { useParams } from "react-router-dom";

const DEBOUNCE_DELAY = 500;

interface CompanySelectorProps {
  name: string;
  onCompanySelected?: (company: CompanySearchResult) => void;
  allowForeignCompanies?: boolean;
  // force l'affichage d'un formulaire pour entrer manuellement les coordonnées
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
  forceManualForeignCompanyForm = false,
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
  const { setFieldError, setFieldValue } = useFormikContext();
  const [isForeignCompany, setIsForeignCompany] = useState(
    `${field.name}.country` !== "FR"
  );

  const [clue, setClue] = useState("");
  const [department, setDepartement] = useState<null | string>(null);
  const [mustBeRegistered, setMustBeRegistered] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [
    toggleManualForeignCompanyForm,
    setToggleManualForeignCompanyForm,
  ] = useState<boolean>(false);
  const timeout = useRef<number | null>();

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
  const {
    loading: isLoadingFavorites,
    data: favoritesData,
    error: favoritesError,
  } = useQuery<Pick<Query, "favorites">, QueryFavoritesArgs>(FAVORITES, {
    variables: {
      siret,
      type: favoriteType,
    },
    skip: skipFavorite,
  });

  const privateInfosClue = field.value.siret
    ? field.value.siret
    : field.value.vatNumber
    ? field.value.vatNumber
    : "";
  /**
   * CompanyPrivateInfos pour completer les informations
   * initialement enregistrées dans le BSD
   */
  const { data: selectedData } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_SELECTOR_PRIVATE_INFOS, {
    variables: {
      clue: privateInfosClue,
    },
    skip: !privateInfosClue,
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
      // Effets de bord
      setMustBeRegistered(!company.isRegistered && registeredOnlyCompanies);
      // Doubler l'erreur affichée dans le dom par ce toaster asur le click
      if (company.name === "---" || company.name === "") {
        cogoToast.error(
          "Cet établissement existe mais nous ne pouvons pas remplir automatiquement le formulaire"
        );
      }

      // Assure la mise à jour des variables d'etat d'affichage des sous-parties du Form
      setToggleManualForeignCompanyForm(
        company.codePaysEtrangerEtablissement !== "FR" &&
          (company.name === "---" || company.name === "")
      );

      setIsForeignCompany(company.codePaysEtrangerEtablissement !== "FR");
      // Prépare la mise à jour du Form
      const fields: FormCompany = {
        siret: company.siret,
        vatNumber: company.vatNumber,
        name: company.name ?? "",
        address: company.address ?? "",
        contact: company.contact ?? "",
        phone: company.contactPhone ?? "",
        mail: company.contactEmail ?? "",
        country: company.codePaysEtrangerEtablissement,
      };

      // Automatiquement écraser le champ country
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

      // callback to the parent component
      if (onCompanySelected) {
        onCompanySelected(company);
      }
    },
    [
      field.name,
      setFieldValue,
      setIsForeignCompany,
      setToggleManualForeignCompanyForm,
      onCompanySelected,
      disabled,
      registeredOnlyCompanies,
      setMustBeRegistered,
    ]
  );

  useEffect(() => {
    setToggleManualForeignCompanyForm(
      !!isForeignCompany &&
        (field.value.name === "---" || field.value.name === "")
    );
  }, [field.value.name, isForeignCompany, setToggleManualForeignCompanyForm]);

  useEffect(() => {
    setIsForeignCompany(field.value.country !== "FR");
  }, [field.value.country, setIsForeignCompany]);

  const favoriteToCompanySearchResult = ({
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
    isRegistered,
    phone,
    mail,
    contact,
  }: CompanyFavorite): CompanySearchResult => ({
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
    contact,
    contactPhone: phone,
    contactEmail: mail,
    isRegistered,
    companyTypes: [],
    etatAdministratif: "A",
  });

  /**
   * Fusionne les réponses de searchCompanies et favoritesData
   */
  useEffect(() => {
    if (disabled) return;
    let mergedResults:
      | CompanySearchResult[]
      | undefined = searchData?.searchCompanies
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
        }) => ({
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
          contact,
          contactPhone,
          contactEmail,
          isRegistered,
          companyTypes,
          etatAdministratif,
        })
      )
      .filter(company => company.etatAdministratif === "A");

    if (mergedResults) {
      // Concatener les favoris sauf doublons
      mergedResults = mergedResults.concat(
        favoritesData?.favorites
          .filter(
            fav =>
              !skipFavorite &&
              !searchData?.searchCompanies
                .map(company => company.siret)
                .includes(fav.siret) &&
              !searchData?.searchCompanies
                .map(company => company.vatNumber)
                .includes(fav.vatNumber)
          )
          .map(favorite => favoriteToCompanySearchResult(favorite)) ?? []
      );
    } else if (favoritesData?.favorites) {
      mergedResults = favoritesData?.favorites
        .filter(fav => !skipFavorite)
        .map(favorite => favoriteToCompanySearchResult(favorite));
    } else {
      mergedResults = [];
    }
    setSearchResults(mergedResults);
  }, [disabled, searchData, favoritesData, setSearchResults, skipFavorite]);

  /**
   * Démarre la requete avec un délai
   */
  useEffect(() => {
    timeout.current = setTimeout(() => {
      if (clue.length < 3) {
        return;
      }
      const isValidSiret = isSiret(clue);
      const isValidVat = isVat(clue);
      const isTextSearch = !isValidSiret && !isValidVat;

      if (isValidSiret || isTextSearch) {
        setIsForeignCompany(false);
        setFieldValue(`${field.name}.vatNumber`, "");
        searchCompaniesQuery({
          variables: {
            clue,
            department: department,
          },
        });
      } else if (isValidVat) {
        if (allowForeignCompanies) {
          if (isFRVat(clue)) {
            setFieldError(
              `${field.name}.siret`,
              "Vous devez identifier un établissement français par son numéro de SIRET (14 chiffres) et pas par son numéro de TVA"
            );
          } else {
            setIsForeignCompany(true);
            setFieldValue(`${field.name}.vatNumber`, clue);
            setFieldValue(`${field.name}.siret`, "");
            searchCompaniesQuery({
              variables: {
                clue,
              },
            });
          }
        } else {
          setFieldError(
            `${field.name}.siret`,
            "Vous ne pouvez pas chercher un établissement par son numéro de TVA, mais par nom ou numéro de SIRET"
          );
        }
      } else {
        setFieldError(
          `${field.name}.siret`,
          "Vous devez entrer un numéro SIRET valide (14 chiffres) ou le nom d'une entreprise française"
        );
      }
      timeout.current = null;
    }, DEBOUNCE_DELAY);

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
    };
  }, [
    clue,
    department,
    setIsForeignCompany,
    setFieldValue,
    searchCompaniesQuery,
    setFieldError,
    allowForeignCompanies,
    field.name,
  ]);

  /**
   * Selection Company si le form est vierge
   */
  useEffect(() => {
    if (
      !optional &&
      searchResults.length >= 1 &&
      !field.value.siret?.length &&
      !field.value.vatNumber?.length
    ) {
      selectCompany(searchResults[0]);
    }
  }, [
    optional,
    field.value.siret?.length,
    field.value.vatNumber?.length,
    searchResults,
    selectCompany,
  ]);

  return (
    <>
      {favoritesError && (
        <NotificationError
          apolloError={favoritesError}
          message={error => error.message}
        />
      )}
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
              {allowForeignCompanies ? (
                <small className="tw-block">
                  ou numéro de TVA intracommunautaire pour les entreprises
                  étrangères
                </small>
              ) : (
                ""
              )}
            </label>
            <div>{JSON.stringify(field.value)}</div>
            <div className="tw-flex tw-items-center tw-mr-4">
              <input
                id={`siret-${uniqId}`}
                type="text"
                className="td-input tw-w-2/3"
                onChange={event => {
                  setClue(event.target.value);
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
        {(field.value.name === "" || field.value.name === "---") && (
          <SimpleNotificationError
            message={
              <>
                <span>
                  Cet établissement existe mais nous ne pouvons pas remplir
                  automatiquement le formulaire
                </span>
              </>
            }
          />
        )}
        {!field.value.vatNumber && !field.value.siret && (
          <SimpleNotificationError
            message={
              <>
                <span>La sélection d'un établissement est obligatoire</span>
              </>
            }
          />
        )}
        {mustBeRegistered && (
          <SimpleNotificationError
            message={
              <>
                <span>
                  Cet établissement n'est pas inscrit sur Trackdéchets, nous ne
                  pouvons pas l'ajouter dans ce formulaire
                </span>
              </>
            }
          />
        )}

        {searchData?.searchCompanies.length === 0 && !isLoadingSearch && (
          <span>Aucun établissement ne correspond à cette recherche...</span>
        )}

        <CompanyResults<CompanySearchResult>
          onSelect={company => selectCompany(company)}
          results={searchResults}
          selectedItem={{
            siret: field.value.siret,
            vatNumber: field.value.vatNumber,
            name: field.value.name,
            address: field.value.address,
            // complète avec isRegistered
            ...(selectedData?.companyPrivateInfos &&
            isSelected(selectedData?.companyPrivateInfos, field.value)
              ? { isRegistered: selectedData?.companyPrivateInfos.isRegistered }
              : {}),
          }}
        />
        <div className="form__row">
          {allowForeignCompanies &&
            (isForeignCompany ||
              forceManualForeignCompanyForm ||
              toggleManualForeignCompanyForm) && (
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
