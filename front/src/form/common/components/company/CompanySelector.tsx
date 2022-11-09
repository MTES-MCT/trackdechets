import { useLazyQuery, useQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import {
  NotificationError,
  SimpleNotificationError,
} from "common/components/Error";
import { IconLoading, IconSearch } from "common/components/Icons";
import RedErrorMessage from "common/components/RedErrorMessage";
import { constantCase } from "constant-case";
import { Field, useField, useFormikContext } from "formik";
import {
  countries as vatCountries,
  isFRVat,
  isVat,
} from "generated/constants/companySearchHelpers";
import { checkVAT } from "jsvat";
import React, { useMemo, useRef, useState } from "react";

import { debounce } from "common/helper";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import {
  CompanyFavorite,
  CompanySearchResult,
  FavoriteType,
  FormCompany,
  Query,
  QueryCompanyPrivateInfosArgs,
  QueryFavoritesArgs,
  QuerySearchCompaniesArgs,
} from "generated/graphql/types";
import { useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import CompanyResults from "./CompanyResults";
import styles from "./CompanySelector.module.scss";
import CountrySelector from "./CountrySelector";
import {
  COMPANY_SELECTOR_PRIVATE_INFOS,
  FAVORITES,
  SEARCH_COMPANIES,
} from "./query";
import { CONTACT_EMAIL } from "common/config";

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
  isBsdaTransporter?: boolean;
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
  isBsdaTransporter = false,
  optional = false,
}: CompanySelectorProps) {
  const { siret } = useParams<{ siret: string }>();
  const [uniqId] = useState(() => uuidv4());
  const [field] = useField<FormCompany>({ name });
  const { setFieldError, setFieldValue, setFieldTouched } = useFormikContext();
  const [isForeignCompany, setIsForeignCompany] = useState(
    `${field.name}.country` !== "FR"
  );

  const departmentInputRef = useRef<HTMLInputElement>(null);
  const clueInputRef = useRef<HTMLInputElement>(null);
  const [mustBeRegistered, setMustBeRegistered] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [toggleManualForeignCompanyForm, setToggleManualForeignCompanyForm] =
    useState<boolean>(false);

  // Favortite type is deduced from the field prefix (transporter, emitter, etc)
  const favoriteType = constantCase(field.name.split(".")[0]) as FavoriteType;
  const {
    loading: isLoadingFavorites,
    data: favoritesData,
    error: favoritesError,
  } = useQuery<Pick<Query, "favorites">, QueryFavoritesArgs>(FAVORITES, {
    variables: {
      siret,
      type: Object.values(FavoriteType).includes(favoriteType)
        ? favoriteType
        : FavoriteType.Emitter,
    },
    skip: skipFavorite,
    onCompleted: data => {
      mergeResults([], data?.favorites ?? []);
    },
  });

  /**
   * SearchCompanies can search by name, vat or siret.
   */
  const [
    searchCompaniesQuery,
    { loading: isLoadingSearch, data: searchData, error },
  ] = useLazyQuery<Pick<Query, "searchCompanies">, QuerySearchCompaniesArgs>(
    SEARCH_COMPANIES,
    {
      onCompleted: data => {
        mergeResults(
          data?.searchCompanies ?? [],
          favoritesData?.favorites ?? []
        );
      },
    }
  );

  /**
   * CompanyPrivateInfos pour completer les informations
   * initialement enregistrées dans le BSD
   */
  const { data: selectedData } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_SELECTOR_PRIVATE_INFOS, {
    variables: {
      clue: getFormCompanyIdentifier(field.value),
    },
    skip: !getFormCompanyIdentifier(field.value).length,
  });

  /**
   * Selection d'un établissement dans le formulaire
   */
  function selectCompany(company: CompanySearchResult) {
    if (disabled) return;
    // empty the  selected company when null
    if (!company) return setFieldValue(field.name, getInitialCompany());

    // Side effects
    const notVoidCompany = Object.keys(company).length !== 0; // unselect returns emtpy object {}
    setMustBeRegistered(
      notVoidCompany && !company.isRegistered && registeredOnlyCompanies
    );
    // On click display form error in a toast message
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
      const vatCountryCode = checkVAT(company.vatNumber, vatCountries)?.country
        ?.isoCode.short;
      if (vatCountryCode) {
        fields.country = vatCountryCode;
      }
    }

    Object.keys(fields).forEach(key => {
      setFieldValue(`${field.name}.${key}`, fields[key]);
    });

    onCompanySelected?.(company);
  }

  /**
   * Merge searchCompanies et favoritesData
   */
  function mergeResults(
    searchCompanies: CompanySearchResult[],
    favorites: CompanyFavorite[]
  ) {
    if (disabled) return;

    const reshapedFavorites =
      favorites
        .filter(
          fav =>
            !skipFavorite &&
            !searchCompanies.some(
              company =>
                company.siret === fav.siret ||
                company.vatNumber === fav.vatNumber
            )
        )
        .map(favorite => favoriteToCompanySearchResult(favorite)) ?? [];

    const reshapedSearchResults =
      searchCompanies
        .filter(company => company.etatAdministratif === "A")
        .map(company => ({
          ...company,
          codePaysEtrangerEtablissement: company.codePaysEtrangerEtablissement
            ? company.codePaysEtrangerEtablissement
            : "FR",
        })) ?? [];

    const results = [...reshapedSearchResults, ...reshapedFavorites];
    setSearchResults(results);

    // If the form is empty and we have a single result, we auto-select it.
    if (
      !optional &&
      results.length >= 1 &&
      !field.value.siret?.length &&
      !field.value.vatNumber?.length
    ) {
      selectCompany(results[0]);
    }
  }

  const onSearch = useMemo(() => {
    async function triggerSearch(
      clue: string | undefined,
      department: string | undefined
    ) {
      if (!clue || clue.length < 3) return;

      const isValidVat = isVat(clue);

      if (isValidVat) {
        if (isFRVat(clue)) {
          setFieldTouched(`${field.name}.siret`);
          return setFieldError(
            `${field.name}.siret`,
            "Vous devez identifier un établissement français par son numéro de SIRET (14 chiffres) et pas par son numéro de TVA"
          );
        }
        if (!allowForeignCompanies) {
          setFieldTouched(`${field.name}.siret`);
          return setFieldError(
            `${field.name}.siret`,
            "Vous ne pouvez pas chercher un établissement par son numéro de TVA, mais par nom ou numéro de SIRET"
          );
        }
      }
      await searchCompaniesQuery({
        variables: {
          clue,
          ...(!isValidVat && { department }),
        },
      });
    }

    return debounce(triggerSearch, DEBOUNCE_DELAY);
  }, [
    setFieldError,
    setFieldTouched,
    searchCompaniesQuery,
    field.name,
    allowForeignCompanies,
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
                `Nous n'avons pas pu récupérer les informations.` +
                `Veuillez nous contacter à l'adresse ${CONTACT_EMAIL} pour pouvoir procéder à la création de l'établissement`
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
            <div className="tw-flex tw-items-center tw-mr-4">
              <input
                id={`siret-${uniqId}`}
                type="text"
                className="td-input tw-w-2/3"
                ref={clueInputRef}
                onChange={event => {
                  onSearch(
                    event.target.value,
                    departmentInputRef.current?.value
                  );
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
              ref={departmentInputRef}
              onChange={event => {
                onSearch(clueInputRef.current?.value, event.target.value);
              }}
              disabled={disabled}
            />
          </div>
        </div>
        {toggleManualForeignCompanyForm === true && (
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
        {!isLoadingFavorites &&
          !field.value.vatNumber &&
          !field.value.siret &&
          !optional && (
            <SimpleNotificationError
              message={
                <>
                  <span>
                    {isBsdaTransporter
                      ? "La sélection d'un transporteur sera obligatoire avant la signature de l'entreprise de travaux"
                      : "La sélection d'un établissement est obligatoire"}
                  </span>
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
        <RedErrorMessage name={`${field.name}.siret`} />
        <CompanyResults<CompanySearchResult>
          onSelect={company => selectCompany(company)}
          onUnselect={() => selectCompany({})}
          results={searchResults}
          selectedItem={{
            siret: field.value.siret,
            vatNumber: field.value.vatNumber,
            name: field.value.name,
            address: field.value.address,
            codePaysEtrangerEtablissement: field.value.country,
            // complete with isRegistered
            ...(selectedData?.companyPrivateInfos && {
              isRegistered: selectedData?.companyPrivateInfos.isRegistered,
            }),
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

function favoriteToCompanySearchResult(
  company: CompanyFavorite
): CompanySearchResult {
  return {
    siret: company.siret,
    vatNumber: company.vatNumber,
    name: company.name,
    address: company.address,
    transporterReceipt: company.transporterReceipt,
    traderReceipt: company.traderReceipt,
    brokerReceipt: company.brokerReceipt,
    vhuAgrementDemolisseur: company.vhuAgrementDemolisseur,
    vhuAgrementBroyeur: company.vhuAgrementBroyeur,
    codePaysEtrangerEtablissement: company.codePaysEtrangerEtablissement
      ? company.codePaysEtrangerEtablissement
      : "FR",
    contact: company.contact,
    contactPhone: company.phone,
    contactEmail: company.mail,
    isRegistered: company.isRegistered,
    companyTypes: [],
    etatAdministratif: "A",
  };
}

function getFormCompanyIdentifier(company: FormCompany): string {
  if (company.siret) {
    return company.siret;
  } else if (company.vatNumber) {
    return company.vatNumber;
  }
  return "";
}
