import { useLazyQuery, useQuery } from "@apollo/client";
//todo:  delete
import {
  NotificationError,
  SimpleNotificationError
} from "../../../../Apps/common/Components/Error/Error";
import {
  IconLoading,
  IconSearch
} from "../../../../Apps/common/Components/Icons/Icons";
import RedErrorMessage from "../../../../common/components/RedErrorMessage";
import { constantCase } from "constant-case";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { useFormContext } from "react-hook-form";

import { isFRVat, isVat, isForeignVat } from "@td/constants";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { debounce } from "../../../../common/helper";
import { getInitialCompany } from "../../../bsdd/utils/initial-state";
import {
  BsdasriTransporterInput,
  BsdaTransporterInput,
  BsvhuTransporterInput,
  CompanySearchResult,
  CompanySearchPrivate,
  FavoriteType,
  FormCompany,
  Maybe,
  Query,
  QueryCompanyPrivateInfosArgs,
  QueryFavoritesArgs,
  QuerySearchCompaniesArgs,
  TransporterInput,
  BsffTransporterInput,
  TransportMode
} from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import CompanyResults from "./CompanyResults";
import styles from "./CompanySelector.module.scss";
import {
  COMPANY_SELECTOR_PRIVATE_INFOS,
  FAVORITES,
  SEARCH_COMPANIES
} from "../../../../Apps/common/queries/company/query";
import TransporterRecepisseWrapper from "./TransporterRecepisseWrapper";

const DEBOUNCE_DELAY = 500;

interface CompanySelectorProps {
  name: string;
  // Callback for the host component
  // Called with empty parameter to un-select a company
  onCompanySelected?: (
    company?: CompanySearchResult | CompanySearchPrivate
  ) => void;
  onCompanyPrivateInfos?: (company?: CompanySearchPrivate) => void;
  allowForeignCompanies?: boolean;
  registeredOnlyCompanies?: boolean;
  heading?: string;
  disabled?: boolean;
  optionalMail?: boolean;
  skipFavorite?: boolean;
  isBsdaTransporter?: boolean;
  // whether the company is optional
  optional?: boolean;
  initialAutoSelectFirstCompany?: boolean;
}

export default function CompanySelector({
  name,
  onCompanySelected,
  allowForeignCompanies = false,
  registeredOnlyCompanies = false,
  heading,
  disabled,
  optionalMail = false,
  skipFavorite = false,
  isBsdaTransporter = false,
  optional = false,
  initialAutoSelectFirstCompany = true,
  onCompanyPrivateInfos = undefined
}: CompanySelectorProps) {
  const { register, setValue, setError, getValues, getFieldState } =
    useFormContext();
  // const setFieldTouched = fieldName => setValue(fieldName, getValues(fieldName));
  // siret is the current active company
  const { siret } = useParams<{ siret: string }>();
  const [uniqId] = useState(() => uuidv4());
  // full rhf form
  const formValues = getValues();
  const company = getValues(name) ?? {};

  const fieldName = name;

  const [hasAutoselected, setHasAutoselected] = useState(false);
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState({
    name: company?.name,
    address: company?.address
  });
  // todo: setFieldTouched

  const isRoadTransport =
    (formValues?.transporter as TransporterInput)?.mode ===
      TransportMode.Road ||
    (
      formValues?.transporter as
        | BsdaTransporterInput
        | BsdasriTransporterInput
        | BsffTransporterInput
    )?.transport?.mode === TransportMode.Road;

  // determine if the current Form company is foreign
  const [isForeignCompany, setIsForeignCompany] = useState(
    (company?.country && company?.country !== "FR") ||
      isForeignVat(company?.vatNumber!)
  );
  // this 2 input ref are to cross-link the value of the input in both search input and department input
  const departmentInputRef = useRef<HTMLInputElement>(null);
  const clueInputRef = useRef<HTMLInputElement>(null);
  const [mustBeRegistered, setMustBeRegistered] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [
    displayForeignCompanyWithUnknownInfos,
    setDisplayForeignCompanyWithUnknownInfos
  ] = useState<boolean>(false);

  // Memoize for changes in company.siret and company.orgId
  // To support both FormCompany and Intermediary (which doesn't have orgId)
  const orgId = useMemo(
    () => company?.orgId ?? company?.siret ?? null,
    [company?.siret, company?.orgId]
  );
  // Favorite type is deduced from the field prefix (transporter, emitter, etc)
  const favoriteType = constantCase(fieldName.split(".")[0]) as FavoriteType;
  const {
    loading: isLoadingFavorites,
    data: favoritesData,
    error: favoritesError
  } = useQuery<Pick<Query, "favorites">, QueryFavoritesArgs>(
    FAVORITES(favoriteType),
    {
      variables: {
        orgId: siret!,
        type: Object.values(FavoriteType).includes(favoriteType)
          ? favoriteType
          : FavoriteType.Emitter,
        allowForeignCompanies
      },
      skip: skipFavorite || !siret
    }
  );

  /**
   * SearchCompanies can search by name, vat or siret.
   */
  const [
    searchCompaniesQuery,
    { loading: isLoadingSearch, data: searchData, error }
  ] = useLazyQuery<Pick<Query, "searchCompanies">, QuerySearchCompaniesArgs>(
    SEARCH_COMPANIES
  );

  /**
   * Merge searchCompanies et favoritesData
   */
  useEffect(() => {
    if (disabled) return;

    const searchCompanies = searchData?.searchCompanies ?? [];
    const favorites = favoritesData?.favorites ?? [];

    const reshapedFavorites = favorites.filter(
      fav =>
        !skipFavorite &&
        !searchCompanies.some(company => company.orgId === fav.orgId)
    );

    const reshapedSearchResults =
      searchCompanies
        .filter(company => company.etatAdministratif === "A")
        .map(company => ({
          ...company,
          codePaysEtrangerEtablissement:
            company.codePaysEtrangerEtablissement || "FR"
        })) ?? [];

    const results = [...reshapedSearchResults, ...reshapedFavorites];
    setSearchResults(results);
  }, [favoritesData, searchData, disabled, skipFavorite]);

  /**
   * CompanyPrivateInfos pour completer les informations
   * de la Company courante enregistrée dans le BSD à son ouverture
   */
  const { data: companyPrivateData, loading: isLoadingCompanyPrivateData } =
    useQuery<Pick<Query, "companyPrivateInfos">, QueryCompanyPrivateInfosArgs>(
      COMPANY_SELECTOR_PRIVATE_INFOS,
      {
        variables: {
          // Compatibility with intermediaries that don't have orgId
          clue: orgId!
        },
        skip: !orgId
      }
    );

  /**
   * Memoize companyPrivateData to avoid too many effects and renders
   */
  const savedCompanyInfos = useMemo(
    () => companyPrivateData?.companyPrivateInfos,
    [companyPrivateData]
  );

  /**
   * Fonctions du changement de companyPrivateData
   */
  useEffect(() => {
    if (savedCompanyInfos) {
      // propagate to parent components
      onCompanyPrivateInfos?.(savedCompanyInfos);
      // hack to auto-complete the country
      if (savedCompanyInfos?.codePaysEtrangerEtablissement) {
        setValue(
          `${fieldName}.country`,
          savedCompanyInfos.codePaysEtrangerEtablissement
        );
      }
    }
  }, [savedCompanyInfos, fieldName, onCompanyPrivateInfos, setValue]);

  /**
   * Selection d'un établissement dans le formulaire
   */

  const selectCompany = useCallback(
    (company?: CompanySearchResult) => {
      function isUnknownCompanyName(companyName?: string): boolean {
        return companyName === "---" || companyName === "";
      }

      if (disabled) return;
      // empty the fields
      if (!company) {
        setValue(fieldName, getInitialCompany());
        // setFieldTouched(`${fieldName}`, true, true);
        setValue(fieldName, getValues(fieldName));
        onCompanySelected?.();
        return;
      }

      // Side effects
      const notVoidCompany = Object.keys(company).length !== 0; // unselect returns emtpy object {}
      setMustBeRegistered(
        notVoidCompany && !company.isRegistered && registeredOnlyCompanies
      );

      // Assure la mise à jour des variables d'etat d'affichage des sous-parties du Form
      setDisplayForeignCompanyWithUnknownInfos(
        isForeignVat(company.vatNumber!) && isUnknownCompanyName(company.name!)
      );

      setIsForeignCompany(isForeignVat(company.vatNumber!));
      // Prépare la mise à jour du Form
      const fields: FormCompany = {
        orgId: company.orgId,
        siret: company.siret,
        vatNumber: company.vatNumber,
        name:
          company.name && !isUnknownCompanyName(company.name)
            ? company.name
            : "",
        address: company.address ?? "",
        contact: company.contact ?? "",
        phone: company.contactPhone ?? "",
        mail: company.contactEmail ?? "",
        country: company.codePaysEtrangerEtablissement
      };

      Object.keys(fields).forEach(key => {
        setValue(`${fieldName}.${key}`, fields[key]);
      });
      // setFieldTouched(`${fieldName}`, true, true);
      setValue(fieldName, getValues(fieldName));
      onCompanySelected?.(company);

      setSelectedCompanyDetails({
        name: company.name,
        address: company.address
      });
    },
    [
      setSelectedCompanyDetails,
      onCompanySelected,
      setFieldTouched,
      setValue,
      setIsForeignCompany,
      setDisplayForeignCompanyWithUnknownInfos,
      setMustBeRegistered,
      disabled,
      fieldName,
      registeredOnlyCompanies
    ]
  );

  useEffect(() => {
    // If the form is empty, we auto-select the first result.
    if (
      initialAutoSelectFirstCompany &&
      !optional &&
      searchResults.length >= 1 &&
      !orgId &&
      !hasAutoselected
    ) {
      setHasAutoselected(true);
      selectCompany(searchResults[0]);
    }
  }, [
    searchResults,
    initialAutoSelectFirstCompany,
    optional,
    orgId,
    selectCompany,
    hasAutoselected
  ]);

  const onSearch = useMemo(() => {
    async function triggerSearch(
      clue: string | undefined,
      department: string | undefined
    ) {
      if (!clue || clue.length < 3) return;

      const isValidVat = isVat(clue);

      if (isValidVat) {
        if (isFRVat(clue)) {
          setFieldTouched(`${fieldName}.siret`);
          return setError(
            `${fieldName}.siret`,
            "Vous devez identifier un établissement français par son numéro de SIRET (14 chiffres) et pas par son numéro de TVA"
          );
        }
        if (!allowForeignCompanies) {
          setFieldTouched(`${fieldName}.siret`);
          return setError(
            `${fieldName}.siret`,
            "Vous ne pouvez pas chercher un établissement par son numéro de TVA, mais seulement par nom ou numéro de SIRET"
          );
        }
      }
      await searchCompaniesQuery({
        variables: {
          clue,
          ...(department && department.length >= 2 && { department })
        }
      });
    }

    return debounce(triggerSearch, DEBOUNCE_DELAY);
  }, [
    setError,
    setFieldTouched,
    searchCompaniesQuery,
    fieldName,
    allowForeignCompanies
  ]);

  // Disable the name field for foreign companies whose name is filled
  const disableNameField =
    disabled ||
    (!!selectedCompanyDetails.name && !displayForeignCompanyWithUnknownInfos);

  // Disable the address field for foreign companies whose address is filled
  const disableAddressField =
    disabled ||
    (!!selectedCompanyDetails.address &&
      !displayForeignCompanyWithUnknownInfos);

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
                `Veuillez nous contacter via ` +
                (
                  <a
                    href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
                    target="_blank"
                    rel="noreferrer"
                  >
                    la FAQ
                  </a>
                ) +
                ` pour pouvoir procéder à la création de l'établissement`
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
        {displayForeignCompanyWithUnknownInfos && (
          <SimpleNotificationError
            message={
              <span>
                Cet établissement existe mais nous ne pouvons pas remplir
                automatiquement le formulaire car les informations sont cachées
                par le service de recherche administratif externe à
                Trackdéchets.{" "}
                <b>Merci de compléter les informations dans le formulaire.</b>
              </span>
            }
          />
        )}
        {!isLoadingFavorites && !isLoadingSearch && !orgId && !optional && (
          <SimpleNotificationError
            message={
              <span>
                {isBsdaTransporter
                  ? "La sélection d'un transporteur sera obligatoire avant la signature de l'entreprise de travaux"
                  : "La sélection d'un établissement est obligatoire"}
              </span>
            }
          />
        )}
        {mustBeRegistered && (
          <SimpleNotificationError
            message={
              <span>
                Cet établissement n'est pas inscrit sur Trackdéchets, nous ne
                pouvons pas l'ajouter dans ce formulaire
              </span>
            }
          />
        )}
        {searchData?.searchCompanies.length === 0 && !isLoadingSearch && (
          <span>Aucun établissement ne correspond à cette recherche...</span>
        )}
        {/* <RedErrorMessage name={`${fieldName}.siret`} /> */}
        {!isLoadingCompanyPrivateData && (
          <CompanyResults<CompanySearchResult>
            onSelect={company => selectCompany(company)}
            onUnselect={() => selectCompany()}
            results={searchResults}
            selectedItem={
              {
                orgId,
                siret: company?.siret,
                vatNumber: company?.vatNumber,
                name: company?.name,
                address: company?.address,
                codePaysEtrangerEtablissement: company?.country,
                // complete with companyPrivateInfos data
                ...(savedCompanyInfos && {
                  ...savedCompanyInfos
                })
              } as CompanySearchResult
            }
          />
        )}
        <div className="form__row">
          {allowForeignCompanies && isForeignCompany && (
            <>
              <Input
                label="Nom de l'entreprise"
                nativeInputProps={{
                  ...register(`${fieldName}.name`, {
                    disabled: disableNameField
                  })
                }}
              />

              {/* <RedErrorMessage name={`${fieldName}.name`} /> */}

              <label>
                Adresse de l'entreprise
                {/* <Field
                  type="text"
                  className="td-input"
                  name={`${fieldName}.address`}
                  placeholder="Adresse"
                  disabled={disableAddressField}
                /> */}
              </label>
              <Input
                label="Adresse de l'entreprise"
                nativeInputProps={{
                  ...register(`${fieldName}.address`, {
                    disabled: disableAddressField
                  })
                }}
              />
              {/* <RedErrorMessage name={`${fieldName}.address`} /> */}

              <Input
                label="Pays de l'entreprise"
                nativeInputProps={{
                  ...register(`${fieldName}.country`, {
                    disabled: true
                  })
                }}
              />
              {/* <RedErrorMessage name={`${fieldName}.country`} /> */}
            </>
          )}

          <Input
            label="Personne à contacter"
            nativeInputProps={{
              ...register(`${fieldName}.contact`)
            }}
          />

          {/* <RedErrorMessage name={`${fieldName}.contact`} /> */}
        </div>
        <div className="form__row">
          <Input
            label="Téléphone ou Fax"
            nativeInputProps={{
              placeholder: "Numéro",
              ...register(`${fieldName}.phone`)
            }}
          />

          {/* <RedErrorMessage name={`${fieldName}.phone`} /> */}
        </div>
        <div className="form__row">
          <Input
            label={`Mail todo`}
            nativeInputProps={{
              type: "email",
              ...register(`${fieldName}.mail`)
            }}
          />

          {/* <RedErrorMessage name={`${fieldName}.mail`} /> */}
        </div>

        {!!orgId && name === "transporter.company" && isRoadTransport && (
          <TransporterRecepisseWrapper transporter={formValues.transporter!} />
        )}
      </div>
    </>
  );
}
