import React, { useState, useMemo } from "react";
import { CompanySelectorProps } from "./companySelectorTypes";
import CompanySelectorItem from "./CompanySelectorItem";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { InlineLoader } from "../../../../Apps/common/Components/Loader/Loaders";
import { debounce } from "../../../../common/helper";
import useOnClickOutsideRefTarget from "../../../../Apps/common/hooks/useOnClickOutsideRefTarget";
import { CompanySearchResult } from "codegen-ui";

import "./companySelector.scss";

const emptyIcon = (
  <svg
    width="62"
    height="62"
    viewBox="0 0 62 62"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_1918_11530)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M31 62C48.1208 62 62 48.1208 62 31C62 13.8792 48.1208 0 31 0C23.3187 0 20.3989 9.21309 14.9833 13.8398C8.32805 19.5257 0 21.5604 0 31C0 48.1208 13.8792 62 31 62Z"
        fill="#E8EDFF"
      />
      <g filter="url(#filter0_f_1918_11530)">
        <path
          d="M49.5998 20.15H22.7331C21.8771 20.15 21.1831 20.7434 21.1831 21.4754V49.308C21.1831 50.04 21.8771 50.6334 22.7331 50.6334H49.5998C50.4558 50.6334 51.1498 50.04 51.1498 49.308V21.4754C51.1498 20.7434 50.4558 20.15 49.5998 20.15Z"
          fill="#E8EDFF"
        />
      </g>
      <path
        d="M15.1221 22.3486C15.0466 20.8719 16.2235 19.6333 17.7021 19.6333H34.6161C35.9916 19.6333 37.1259 20.711 37.1961 22.0847L38.0944 39.6514C38.1699 41.128 36.993 42.3666 35.5144 42.3666H18.6004C17.2249 42.3666 16.0906 41.2889 16.0204 39.9152L15.1221 22.3486Z"
        fill="#000091"
      />
      <path
        d="M15.1206 25.9638C15.0459 24.4877 16.2226 23.25 17.7006 23.25H46.366C47.844 23.25 49.0207 24.4877 48.946 25.9638L48.0315 44.0471C47.962 45.4214 46.8275 46.5 45.4515 46.5H18.6151C17.2391 46.5 16.1046 45.4214 16.0351 44.0472L15.1206 25.9638Z"
        fill="white"
      />
    </g>
    <defs>
      <filter
        id="filter0_f_1918_11530"
        x="4.68311"
        y="3.65002"
        width="62.9668"
        height="63.4833"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur
          stdDeviation="8.25"
          result="effect1_foregroundBlur_1918_11530"
        />
      </filter>
      <clipPath id="clip0_1918_11530">
        <rect width="62" height="62" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const isSearchValid = searchClue => searchClue.length >= 3;

const CompanySelector = ({
  loading,
  onSelect,
  onSearch,
  companies,
  favorites,
  disabled = false,
  selectedCompany
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

  const handleOnSelect = (company?: CompanySearchResult) => {
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
          {emptyIcon}
          Aucune entreprise sélectionnée récemment
        </div>
      );
    } else if (searchValid && companies && companies.length > 0) {
      return listCompanies(companies, true);
    } else {
      return (
        <div className="company-selector-empty">
          {emptyIcon}
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
        <div className="fr-col-8">
          <Input
            label="Numéro de SIRET ou nom de l'entreprise"
            disabled={disabled}
            nativeInputProps={{
              value: searchString,
              placeholder: "Rechercher",
              onFocus: handleOnFocus,
              onChange: e => {
                debouncedSearch({
                  searchString: e.target.value,
                  postalCodeString: postalCodeString
                });
                setSearchString(e.target.value);
              }
            }}
          />
        </div>
        <div className="fr-col-4">
          <Input
            label="Département ou code postal"
            disabled={disabled}
            nativeInputProps={{
              value: postalCodeString,
              placeholder: "Rechercher",
              onFocus: handleOnFocus,
              onChange: e => {
                debouncedSearch({
                  searchString: searchString,
                  postalCodeString: e.target.value
                });
                setPostalCodeString(e.target.value);
              }
            }}
          />
        </div>
        {(loading || shouldDisplayResults) && (
          <div className="company-selector-results fr-grid-row">
            {loading ? <InlineLoader></InlineLoader> : displayResults()}
          </div>
        )}
      </div>
      {selectedCompany ? (
        <div className="fr-grid-row">
          <div className="fr-col-12">
            <CompanySelectorItem
              company={selectedCompany}
              selected
              onSelect={handleOnSelect}
            ></CompanySelectorItem>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CompanySelector;
