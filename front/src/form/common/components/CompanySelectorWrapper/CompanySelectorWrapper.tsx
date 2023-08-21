import { useLazyQuery } from "@apollo/client";
import React, { useState } from "react";
import CompanySelector from "Apps/common/Components/CompanySelector/CompanySelector";
import {
  CompanySearchResult,
  FavoriteType,
  Query,
  QueryFavoritesArgs,
  QuerySearchCompaniesArgs,
} from "generated/graphql/types";
import {
  FAVORITES,
  SEARCH_COMPANIES,
} from "../../../../Apps/common/queries/company/query";

interface CompanySelectorWrapperProps {
  currentCompany?: CompanySearchResult;
  favoriteType?: FavoriteType;
  allowForeignCompanies?: boolean;
  onCompanySelected?: (company?: CompanySearchResult) => void;
  siret: string;
  disabled?: boolean;
}

export default function CompanySelectorWrapper({
  currentCompany,
  favoriteType = FavoriteType.Emitter,
  allowForeignCompanies = false,
  siret,
  disabled = false,
  onCompanySelected,
}: CompanySelectorWrapperProps) {
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult>();
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>();

  const [
    getFavoritesQuery,
    { loading: isLoadingFavorites, data: favoritesData, error: favoritesError },
  ] = useLazyQuery<Pick<Query, "favorites">, QueryFavoritesArgs>(
    FAVORITES(favoriteType)
  );

  const [
    searchCompaniesQuery,
    { loading: isLoadingSearch, data: searchData, error },
  ] = useLazyQuery<Pick<Query, "searchCompanies">, QuerySearchCompaniesArgs>(
    SEARCH_COMPANIES,
    {
      onCompleted: data => {
        setSearchResults(data?.searchCompanies.slice(0, 6));
      },
    }
  );

  const onSelectCompany = (company?: CompanySearchResult) => {
    setSelectedCompany(company);
    onCompanySelected && onCompanySelected(company);
  };

  const onSearchCompany = (searchClue, postalCodeClue) => {
    if (searchClue.length === 0 && postalCodeClue.length === 0) {
      getFavoritesQuery({
        variables: {
          orgId: siret,
          type: Object.values(FavoriteType).includes(favoriteType)
            ? favoriteType
            : FavoriteType.Emitter,
          allowForeignCompanies,
        },
      });
    } else {
      searchCompaniesQuery({
        variables: {
          clue: searchClue,
          ...(postalCodeClue &&
            postalCodeClue.length >= 2 && { department: postalCodeClue }),
        },
      });
    }
  };

  return (
    <CompanySelector
      loading={isLoadingFavorites || isLoadingSearch}
      onSelect={onSelectCompany}
      onSearch={onSearchCompany}
      favorites={favoritesData?.favorites}
      companies={searchResults}
      selectedCompany={selectedCompany ?? currentCompany}
      disabled={disabled}
    />
  );
}
