// CompanySelectorWrapper fork for react-hook-forms
import { useLazyQuery, ApolloError } from "@apollo/client";
import React, { useCallback, useEffect, useState } from "react";
import CompanySelector from "../CompanySelector/CompanySelector";
import {
  CompanySearchResult,
  FavoriteType,
  Query,
  QueryFavoritesArgs,
  QuerySearchCompaniesArgs
} from "@td/codegen-ui";
import { NotificationError } from "../Error/Error";
import {
  FAVORITES,
  SEARCH_COMPANIES
} from "../../../../Apps/common/queries/company/query";

interface CompanySelectorWrapperProps {
  // Expose le state depuis le composant parent
  // afin d'initialiser le `selectedCompany` au premier
  // render lorsqu'on est dans le cas d'un update de bordereau
  selectedCompanyOrgId?: string | null;
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
 * - Il initialise l'établissement sélectionné à partir des données du store.
 * - Il propage l'événement de sélection d'un établissement au parent pour modifier.
 * les données du store
 */

export default function RhfCompanySelectorWrapper({
  selectedCompanyOrgId,
  favoriteType = FavoriteType.Emitter,
  allowForeignCompanies = false,
  selectedCompanyError,
  orgId,
  disabled = false,
  onCompanySelected
}: Readonly<CompanySelectorWrapperProps>) {
  // Établissement sélectionné
  const [selectedCompany, setSelectedCompany] =
    useState<CompanySearchResult | null>(null);

  const [
    getFavoritesQuery,
    { loading: isLoadingFavorites, data: favoritesData, error: favoritesError }
  ] = useLazyQuery<Pick<Query, "favorites">, QueryFavoritesArgs>(
    FAVORITES(favoriteType)
  );

  // Lazy query de search qui est appelée lors de la saisie de texte
  // dans la barre de recherche du CompanySelector
  const [
    searchCompaniesFromTextSearch,
    { loading: isLoadingSearch, data: searchCompaniesData, error }
  ] = useLazyQuery<Pick<Query, "searchCompanies">, QuerySearchCompaniesArgs>(
    SEARCH_COMPANIES
  );

  // On limite l'affichage des résultats de recherche à 6 établissements
  const searchResults = searchCompaniesData?.searchCompanies.slice(0, 6);

  // Lazy query de search qui est utilisée pour mettre à jour
  // `selectedCompany` à partir de `selectedCompanyOrgId`lors du render
  // initial (Cf useEffect plus bas). On ne peut pas réutiliser la query du dessus car ces deux
  // query peuvent être appelée simultanément (par exemple si je copie colle
  // un numero SIRET dans la barre de recherche immédiatement après l'affichage
  // lors d'une modification de bordereau). Les résultats seraient alors mixés.
  const [searchCompaniesFromCompanyOrgId] = useLazyQuery<
    Pick<Query, "searchCompanies">,
    QuerySearchCompaniesArgs
  >(SEARCH_COMPANIES);

  const onSelectCompany = useCallback(
    (company: CompanySearchResult) => {
      setSelectedCompany(company);
      // propage l'événement au parent pour modifier les données du store (RHF)
      onCompanySelected && onCompanySelected(company);
    },
    [setSelectedCompany, onCompanySelected]
  );

  // S'assure que `selectedCompany` reste sync avec les données
  // du store RHF lors du render initial ou en cas modification
  // des données provoquée par un autre événement que la sélection d'un établissement
  // dans le CompanySelector (par exemple si on permute deux transporteurs
  // dans la liste des transporteurs multi-modaux)
  useEffect(() => {
    if (
      selectedCompanyOrgId &&
      selectedCompanyOrgId !== selectedCompany?.orgId
    ) {
      searchCompaniesFromCompanyOrgId({
        variables: { clue: selectedCompanyOrgId },
        onCompleted: result => {
          if (result.searchCompanies?.length > 0) {
            onSelectCompany(result.searchCompanies[0]);
          }
        }
      });
    }
    if (!selectedCompanyOrgId && selectedCompany) {
      setSelectedCompany(null);
    }
  }, [
    selectedCompany,
    selectedCompanyOrgId,
    searchCompaniesFromCompanyOrgId,
    onSelectCompany
  ]);

  const onSearchCompany = (searchClue: string, postalCodeClue: string) => {
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
    } else if (searchClue.length >= 3) {
      searchCompaniesFromTextSearch({
        variables: {
          clue: searchClue,
          ...(postalCodeClue &&
            postalCodeClue.length >= 2 && { department: postalCodeClue })
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
