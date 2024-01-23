import React, { useState, useMemo, useEffect } from "react";
import { CompanySelectorProps } from "./companySelectorTypes";
import CompanySelectorItem from "./CompanySelectorItem";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { InlineLoader } from "../../../../Apps/common/Components/Loader/Loaders";
import { debounce } from "../../../../common/helper";
import useOnClickOutsideRefTarget from "../../../../Apps/common/hooks/useOnClickOutsideRefTarget";
import { CompanySearchResult } from "@td/codegen-ui";
import { IconEmptyCompany } from "../Icons/Icons";
import "./companySelector.scss";

const isSearchValid = searchClue => searchClue.length >= 3;

const CompanySelector = ({
  loading,
  selectedCompany,
  selectedCompanyError,
  companies,
  favorites,
  disabled = false,
  searchHint,
  departmentHint,
  onSelect,
  onSearch
}: CompanySelectorProps) => {
  const [searchString, setSearchString] = useState("");
  const [postalCodeString, setPostalCodeString] = useState("");
  const [shouldDisplayResults, setShouldDisplayResults] = useState(false);

  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: () => setShouldDisplayResults(false)
  });

  const handleOnFocus = () => {
    setShouldDisplayResults(true);

    if (searchString.length === 0 && postalCodeString.length === 0) {
      onSearch("", "");
    }
  };

  const debouncedSearch = useMemo(
    () =>
      debounce(params => {
        onSearch(params.searchString, params.postalCodeString);
      }, 500),
    [onSearch]
  );

  const handleOnSelect = (company: CompanySearchResult) => {
    setShouldDisplayResults(false);
    onSelect(company);
  };

  const displayResults = () => {
    const listCompanies = (list, shouldPassClues) =>
      list.map(company => (
        <CompanySelectorItem
          company={company}
          onSelect={handleOnSelect}
          searchClue={shouldPassClues ? searchString : ""}
          postalCodeClue={shouldPassClues ? postalCodeString : ""}
          key={company.orgId}
        ></CompanySelectorItem>
      ));

    const searchValid = isSearchValid(searchString);

    if (!searchValid && favorites && favorites.length > 0) {
      return (
        <>
          <div className="company-selector-header">Récents</div>
          {listCompanies(favorites, false)}
        </>
      );
    } else if (!searchValid && (!favorites || favorites.length === 0)) {
      return (
        <div className="company-selector-empty">
          <IconEmptyCompany />
          Aucune entreprise sélectionnée récemment
        </div>
      );
    } else if (searchValid && companies && companies.length > 0) {
      return listCompanies(companies, true);
    } else {
      return (
        <div className="company-selector-empty">
          <IconEmptyCompany />
          Aucun résultat trouvé pour cette recherche
        </div>
      );
    }
  };

  return (
    <div
      ref={targetRef as React.RefObject<HTMLDivElement>}
      className="fr-container--fluid company-selector"
    >
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom company-selector-search">
        <div className="fr-col-12 fr-col-md-8">
          <Input
            label="N°SIRET ou raison sociale"
            hintText={searchHint}
            disabled={disabled}
            nativeInputProps={{
              value: searchString,
              placeholder: "Rechercher",
              onFocus: handleOnFocus,
              onChange: e => {
                setSearchString(e.target.value);
                debouncedSearch({
                  searchString: e.target.value,
                  postalCodeString: postalCodeString
                });
              }
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <Input
            label="Département ou code postal"
            hintText={departmentHint}
            disabled={disabled}
            nativeInputProps={{
              value: postalCodeString,
              placeholder: "Rechercher",
              onFocus: handleOnFocus,
              onChange: e => {
                setPostalCodeString(e.target.value);
                debouncedSearch({
                  searchString,
                  postalCodeString: e.target.value
                });
              }
            }}
          />
        </div>
        {loading && <InlineLoader></InlineLoader>}
        {shouldDisplayResults && (
          <div className="company-selector-results fr-grid-row">
            {displayResults()}
          </div>
        )}
      </div>
      {selectedCompany ? (
        <div className="fr-grid-row">
          <div className="fr-col-12">
            <CompanySelectorItem
              company={selectedCompany}
              selected
              selectedError={selectedCompanyError}
              onSelect={handleOnSelect}
            ></CompanySelectorItem>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CompanySelector;
