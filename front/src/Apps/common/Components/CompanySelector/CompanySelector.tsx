import { Input } from "@codegouvfr/react-dsfr/Input";
import { CompanySearchResult } from "@td/codegen-ui";
import React, { useMemo, useRef, useState } from "react";
import { InlineLoader } from "../../../../Apps/common/Components/Loader/Loaders";
import useOnClickOutsideRefTarget from "../../../../Apps/common/hooks/useOnClickOutsideRefTarget";
import { debounce } from "../../../../common/helper";
import { ComboBox } from "../Combobox/Combobox";
import { IconEmptyCompany } from "../Icons/Icons";
import "./companySelector.scss";
import CompanySelectorItem from "./CompanySelectorItem";
import { CompanySelectorProps } from "./companySelectorTypes";

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
  const parentRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

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
    setSearchString("");
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
      <div
        className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom company-selector-search"
        ref={parentRef}
      >
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
            ref={triggerRef}
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
        {shouldDisplayResults && (
          <ComboBox
            parentRef={parentRef}
            triggerRef={triggerRef}
            isOpen={shouldDisplayResults}
            onOpenChange={open => setShouldDisplayResults(open)}
          >
            {() =>
              loading ? (
                <InlineLoader></InlineLoader>
              ) : (
                <div className="company-selector-results fr-grid-row">
                  {displayResults()}
                </div>
              )
            }
          </ComboBox>
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
