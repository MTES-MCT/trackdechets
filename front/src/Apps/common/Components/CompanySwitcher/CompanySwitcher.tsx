import React, { useState, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";
import { Query, CompanyPrivate } from "@td/codegen-ui";
import { CompanySwitcherProps } from "./companySwitcherTypes";
import { debounce } from "../../../../common/helper";
import { usePermissions } from "../../../../common/contexts/PermissionsContext";
import {
  MIN_MY_COMPANIES_SEARCH,
  MAX_MY_COMPANIES_SEARCH
} from "@td/constants";
import { InlineLoader } from "../Loader/Loaders";
import useOnClickOutsideRefTarget from "../../hooks/useOnClickOutsideRefTarget";
import "./companySwitcher.scss";

export const SIRET_STORAGE_KEY = "td-siret";

const MY_COMPANIES = gql`
  query MyCompanies($first: Int, $after: ID, $search: String) {
    myCompanies(first: $first, after: $after, search: $search) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
          orgId
          siret
          givenName
          securityCode
        }
      }
    }
  }
`;

// Prevent to short and long clues
const isSearchClueValid = clue =>
  clue.length >= MIN_MY_COMPANIES_SEARCH &&
  clue.length <= MAX_MY_COMPANIES_SEARCH;

const getLocalStorageOrgId = () => {
  const storedItem = window.localStorage.getItem(SIRET_STORAGE_KEY);
  return storedItem && JSON.parse(storedItem);
};

const saveOrgIdToLocalStorage = orgId => {
  window.localStorage.setItem(SIRET_STORAGE_KEY, JSON.stringify(orgId));
};

export const getDefaultOrgId = (companies: CompanyPrivate[]) =>
  getLocalStorageOrgId() ?? (companies.length > 0 && companies[0].orgId) ?? "";

const CompanySwitcher = ({
  currentOrgId,
  companies,
  handleCompanyChange
}: CompanySwitcherProps) => {
  const { updatePermissions } = usePermissions();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [displayPreloader, setDisplayPreloader] = useState(false);

  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: () => setOpen(false)
  });

  const defaultCompany = useMemo(() => {
    return companies.find(company => company.orgId === currentOrgId);
  }, [companies, currentOrgId]);

  const handleOnClickCompany = (orgId: string) => {
    const selectedCompany = companies.find(company => company.orgId === orgId);
    if (selectedCompany) {
      updatePermissions(
        selectedCompany?.userPermissions,
        selectedCompany.userRole!,
        orgId
      );
    }

    setOpen(false);
    handleOnResetSearch();
    saveOrgIdToLocalStorage(orgId);
    handleCompanyChange(orgId);
  };

  const { data, loading, error, refetch } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES, { variables: { first: 10 } });

  const debouncedSearch = useMemo(
    () =>
      debounce(params => {
        refetch(params).then(() => setDisplayPreloader(false));
      }, 1000),
    [refetch, setDisplayPreloader]
  );

  const handleOnChangeSearch = newSearchClue => {
    if (isSearchClueValid(newSearchClue)) {
      setDisplayPreloader(true);
      debouncedSearch({
        search: newSearchClue
      });
    }

    if (newSearchClue.length === 0) {
      handleOnResetSearch();
    }
  };

  const handleOnResetSearch = () => {
    setSearchValue("");
    setDisplayPreloader(true);
    debouncedSearch({ search: "" });
  };

  const displayedItem = (company, onClick?, current?) => {
    const onKeyDown = e => {
      if (e.keyCode === 13 && onClick) {
        onClick();
      }
    };

    return (
      <div
        key={company.orgId}
        className={`company-switcher-item ${
          current ? "company-switcher-item--current" : ""
        }`}
        onClick={onClick}
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="presentation"
      >
        <div className="company-switcher-item__content">
          <div className="company-switcher-item__name">
            {company.givenName || company.name}
          </div>
          <div className="company-switcher-item__infos">
            <div className="company-switcher-item__siret">{company.orgId}</div>
            {current && (
              <p className="fr-tag fr-tag--sm fr-icon-pen-nib-line fr-tag--icon-left">
                {company.securityCode}
              </p>
            )}
          </div>
        </div>
        {current && companies.length > 1 && (
          <span
            className="fr-icon-arrow-down-s-line company-switcher-item__arrow"
            aria-hidden="true"
          ></span>
        )}
      </div>
    );
  };

  const displayCompanies = () => {
    if (loading || displayPreloader) {
      return (
        <div className="company-switcher-loader">
          <InlineLoader></InlineLoader>
        </div>
      );
    }

    if (error) {
      return (
        <div className="company-switcher-message">
          La recherche ne fonctionne pas pour le moment. Veuillez réessayer.
        </div>
      );
    }

    const searchCompanies = data?.myCompanies?.edges.map(({ node }) => node);

    if (searchCompanies && searchCompanies.length > 0)
      return (
        <>
          <div className="company-switcher-count">{`${searchCompanies.length} sur ${companies.length} établissements`}</div>
          {searchCompanies?.map(company =>
            displayedItem(company, () => handleOnClickCompany(company.orgId))
          )}
        </>
      );

    return <div className="company-switcher-message">Aucun résultat</div>;
  };

  return (
    <div
      className={`company-switcher ${open && "company-switcher--open"} ${
        companies.length === 1 && "company-switcher--unique"
      }`}
      ref={targetRef as React.RefObject<HTMLDivElement>}
    >
      {displayedItem(
        defaultCompany,
        () => {
          if (companies.length > 1) setOpen(open => !open);
        },
        true
      )}
      <div className="company-switcher-list">
        {companies.length > 10 && (
          <div className="company-switcher-search">
            <div className="fr-search-bar" id="search-540" role="search">
              <label className="fr-label" htmlFor="search-540-input">
                Rechercher
              </label>
              <input
                className="fr-input"
                placeholder="Rechercher"
                type="search"
                id="search-540-input"
                name="search-540-input"
                onChange={e => {
                  setSearchValue(e.target.value);
                  handleOnChangeSearch(e.target.value);
                }}
                value={searchValue}
              />
              <button className="fr-btn" title="Rechercher">
                Rechercher
              </button>
            </div>
          </div>
        )}
        {displayCompanies()}
      </div>
    </div>
  );
};

export default CompanySwitcher;
