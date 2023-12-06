import { useLazyQuery, ApolloError } from "@apollo/client";
import React, { useCallback, useEffect, useState } from "react";
import CompanySelector from "../../../../Apps/common/Components/CompanySelector/CompanySelector";
import {
  CompanySearchResult,
  FavoriteType,
  Query,
  QueryFavoritesArgs,
  QuerySearchCompaniesArgs
} from "codegen-ui";
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
  allowForeignCompanies?: boolean;
  onCompanySelected?: (company?: CompanySearchResult) => void;
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

  // Initialise `selectedCompany` à partir des données du store (Formik)
  useEffect(() => {
    if (!selectedCompany && formOrgId) {
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
        disabled={disabled}
        searchHint={
          allowForeignCompanies
            ? "ou numéro de TVA intracommunautaire pour les entreprises étrangères"
            : undefined
        }
        departmentHint={
          allowForeignCompanies ? "si l'entreprise est française" : undefined
        }
      />
    </>
  );
}
