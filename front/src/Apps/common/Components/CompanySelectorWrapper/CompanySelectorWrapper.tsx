// Wrapper CompanySelectorWrapper cloned in RhfCompanySelectorWrapper for react-hook-forms

import { useLazyQuery, ApolloError } from "@apollo/client";
import React, { useCallback, useEffect, useState } from "react";
import CompanySelector from "../CompanySelector/CompanySelector";
import {
  CompanySearchResult,
  CompanyType,
  FavoriteType,
  Query,
  QueryFavoritesArgs,
  QuerySearchCompaniesArgs
} from "@td/codegen-ui";
import { NotificationError } from "../Error/Error";
import { FAVORITES, SEARCH_COMPANIES } from "../../queries/company/query";

interface CompanySelectorWrapperProps {
  // Expose le state depuis le composant parent
  // afin d'initialiser le `selectedCompany` au premier
  // render lorsqu'on est dans le cas d'un update de bordereau
  selectedCompanyOrgId?: string | null;
  favoriteType?: FavoriteType;
  // Paramètres qui sont passés à `searchCompanies`, les données sont
  // filtrées directement côté serveur
  allowForeignCompanies?: boolean;
  allowClosedCompanies?: boolean;
  // Callback spécifié par le composant parent pour modifier les données
  // du store
  onCompanySelected?: (company?: CompanySearchResult) => void;
  // Callback spécifié par le composant parent, appelé dans le cas où
  // l'établissement pré-sélectionné via selectedCompanyOrgId n'est pas trouvé
  onUnknownInputCompany?: (company?: CompanySearchResult) => void;
  // Permet de valider que l'établissement sélectionné satisfait certains
  // critères (ex : inscrit sur Trackdéchets avec un profil spécifique)
  selectedCompanyError?: (company?: CompanySearchResult) => string | null;
  // SIRET ou VAT de l'établissement courant (utile pour le calcul des favoris)
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
 * les données du store (Formik ou RHF)
 */

export default function CompanySelectorWrapper({
  selectedCompanyOrgId,
  favoriteType = FavoriteType.Emitter,
  allowForeignCompanies = false,
  allowClosedCompanies = true,
  selectedCompanyError,
  orgId,
  disabled = false,
  onCompanySelected,
  onUnknownInputCompany
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
      // propage l'événement au parent pour modifier les données du store (Formik ou RHF)
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
    if (
      selectedCompanyOrgId &&
      selectedCompanyOrgId !== selectedCompany?.orgId
    ) {
      searchCompaniesFromCompanyOrgId({
        variables: { clue: selectedCompanyOrgId, allowForeignCompanies }
      }).then(result => {
        const searchCompanies = result.data?.searchCompanies;
        if (searchCompanies?.length) {
          onSelectCompany(searchCompanies[0]);
        } else {
          onUnknownInputCompany?.();
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
    onSelectCompany,
    onUnknownInputCompany,
    allowForeignCompanies
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
          allowForeignCompanies,
          allowClosedCompanies,
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
                    className="fr-link force-external-link-content force-underline-link"
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
            ? "ou numéro TVA pour un établissement de l'UE"
            : undefined
        }
        departmentHint={
          allowForeignCompanies ? "si l'entreprise est française" : undefined
        }
      />
    </>
  );
}

/**
 * Fonction utilitaire permettant d'afficher un message d'erreur par défaut
 * lorsqu'un établissement est sélectionné en fonction de son profil
 */
export function selectedCompanyError(
  company: CompanySearchResult,
  expectedCompanyType?: CompanyType
) {
  if (company.etatAdministratif !== "A") {
    // Lors de l'écriture de ces lignes, `searchCompanies` renvoie des établissements
    // fermés lorsque l'on fait une recherche pas raison sociale. Si ce problème est traité
    // dans le futur, on pourra s'abstenir de gérer cette erreur.
    return "Cet établissement est fermé";
  }
  if (!company.isRegistered) {
    return "Cet établissement n'est pas inscrit sur Trackdéchets.";
  }
  if (
    expectedCompanyType &&
    !company.companyTypes?.includes(expectedCompanyType)
  ) {
    const translatedType = () => {
      if (expectedCompanyType === CompanyType.Broker) {
        return "courtier";
      }
      if (expectedCompanyType === CompanyType.Trader) {
        return "négociant";
      }
      // On peut implémenter ici d'autres types de profils
      return "";
    };

    return `Cet établissement n'a pas le profil ${translatedType()}`;
  }
  return null;
}
