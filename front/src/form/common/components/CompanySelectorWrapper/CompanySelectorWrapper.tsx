import { useLazyQuery, ApolloError } from "@apollo/client";
import React, { useCallback, useEffect, useState } from "react";
import CompanySelector from "../../../../Apps/common/Components/CompanySelector/CompanySelector";
import {
  CompanySearchResult,
  FavoriteType,
  Query,
  QueryFavoritesArgs,
  QuerySearchCompaniesArgs
} from "@td/codegen-ui";
import { NotificationError } from "../../../../Apps/common/Components/Error/Error";
import {
  FAVORITES,
  SEARCH_COMPANIES
} from "../../../../Apps/common/queries/company/query";

interface CompanySelectorWrapperProps {
  // Expose le state Formik depuis le composant parent
  // afin d'initialiser le `selectedCompany` au premier
  // render lorsqu'on est dans le cas d'un update de bordereau
  formOrgId?: string | null;
  favoriteType?: FavoriteType;
  // Paramètre qui est passée à `searchCompanies`, les données sont
  // filtrées directement côté serveur
  allowForeignCompanies?: boolean;
  // Callback spécifié par le composant parent pour modifier les données
  // du store
  onCompanySelected?: (company?: CompanySearchResult) => void;
  // Permet de valider que l'établissement sélectionné satisfait certains
  // critères (ex : inscrit sur Trackdéchets avec un profil spécifique)
  selectedCompanyError?: (company?: CompanySearchResult) => string | null;
  // Numéro SIRET ou VAT de l'établissement courant (utile pour le calcul des favoris)
  orgId?: string;
  disabled?: boolean;
}

/**
 * Ce wrapper autour de CompanySelector a plusieurs rôles :
 * - Il stocke l'établissement sélectionné et les résultats de recherche
 * pour piloter l'affiche du CompanySelector.
 * - Il implémente le search et gère les erreurs.
 * - Il initialise l'établissement sélectionné à partir des données du store (Formik).
 * - Il propage l'événement de sélection d'un établissement au parent pour modifier.
 * les données du store (Formik)
 */
export default function CompanySelectorWrapper({
  formOrgId,
  favoriteType = FavoriteType.Emitter,
  allowForeignCompanies = false,
  selectedCompanyError,
  orgId,
  disabled = false,
  onCompanySelected
}: CompanySelectorWrapperProps) {
  // Établissement sélectionné
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult>();

  // Résultats de recherche
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>();

  const [
    getFavoritesQuery,
    { loading: isLoadingFavorites, data: favoritesData, error: favoritesError }
  ] = useLazyQuery<Pick<Query, "favorites">, QueryFavoritesArgs>(
    FAVORITES(favoriteType)
  );

  const [searchCompaniesQuery, { loading: isLoadingSearch, data: _, error }] =
    useLazyQuery<Pick<Query, "searchCompanies">, QuerySearchCompaniesArgs>(
      SEARCH_COMPANIES
    );

  const onSelectCompany = useCallback(
    (company?: CompanySearchResult) => {
      setSelectedCompany(company);
      // propage l'événement au parent pour modifier les données du store (Formik)
      onCompanySelected && onCompanySelected(company);
    },
    [setSelectedCompany, onCompanySelected]
  );

  // S'assure que `selectedCompany` reste sync avec les données
  // du store Formik lors du render initial ou en cas modification
  // des données provoquée par un autre événement que la sélection d'un établissement
  // dans le CompanySelector (par exemple si on permute deux transporteurs
  // dans la liste des transporteurs multi-modaux)
  useEffect(() => {
    if (formOrgId && formOrgId !== selectedCompany?.orgId) {
      searchCompaniesQuery({
        variables: { clue: formOrgId },
        onCompleted: result => {
          if (result.searchCompanies?.length > 0) {
            onSelectCompany(result.searchCompanies[0]);
          }
        }
      });
    }
  }, [selectedCompany, formOrgId, searchCompaniesQuery, onSelectCompany]);

  const onSearchCompany = (searchClue, postalCodeClue) => {
    if (searchClue.length === 0 && postalCodeClue.length === 0 && orgId) {
      getFavoritesQuery({
        variables: {
          orgId,
          type: Object.values(FavoriteType).includes(favoriteType)
            ? favoriteType
            : FavoriteType.Emitter,
          allowForeignCompanies
        }
      });
    } else {
      searchCompaniesQuery({
        variables: {
          clue: searchClue,
          ...(postalCodeClue &&
            postalCodeClue.length >= 2 && { department: postalCodeClue })
        },
        onCompleted: data => {
          setSearchResults(data?.searchCompanies.slice(0, 6));
        }
      });
    }
  };

  const memoizedSelectedCompanyError = React.useMemo(() => {
    if (selectedCompanyError && selectedCompany) {
      return selectedCompanyError(selectedCompany);
    }
    return null;
  }, [selectedCompany, selectedCompanyError]);

  const isForbiddenCompanyError = (error: ApolloError) => {
    return (
      error.graphQLErrors.length &&
      error.graphQLErrors[0].extensions?.code === "FORBIDDEN"
    );
  };

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
            if (isForbiddenCompanyError(error)) {
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
      <CompanySelector
        loading={isLoadingFavorites || isLoadingSearch}
        onSelect={onSelectCompany}
        onSearch={onSearchCompany}
        favorites={favoritesData?.favorites}
        companies={searchResults}
        selectedCompany={selectedCompany}
        selectedCompanyError={memoizedSelectedCompanyError}
        disabled={disabled}
        searchHint={
          allowForeignCompanies
            ? "ou numéro TVA pour un transporteur de l'UE"
            : undefined
        }
        departmentHint={
          allowForeignCompanies ? "si l'entreprise est française" : undefined
        }
      />
    </>
  );
}
