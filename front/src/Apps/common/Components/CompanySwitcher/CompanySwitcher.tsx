import React, { useState, useMemo, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { Query, UserRole } from "@td/codegen-ui";
import { CompanySwitcherProps } from "./companySwitcherTypes";
import { debounce } from "../../../../common/helper";
import {
  MIN_MY_COMPANIES_SEARCH,
  MAX_MY_COMPANIES_SEARCH
} from "@td/constants";
import { InlineLoader } from "../Loader/Loaders";
import useOnClickOutsideRefTarget from "../../hooks/useOnClickOutsideRefTarget";
import "./companySwitcher.scss";
import { useMyCompany } from "../../hooks/useMyCompany";
import { usePermissions } from "../../../../common/contexts/PermissionsContext";

export const SIRET_STORAGE_KEY = "td-siret";

const MY_COMPANIES = gql`
  query SearchMyCompanies($first: Int, $after: ID, $search: String) {
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

export const getDefaultOrgId = (userOrgIds: string[]) => {
  const persistedOrgId = getLocalStorageOrgId();
  if (userOrgIds.includes(persistedOrgId)) {
    return persistedOrgId;
  }
  return userOrgIds[0];
};

const CompanySwitcher = ({
  currentOrgId,
  handleCompanyChange
}: CompanySwitcherProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [displayPreloader, setDisplayPreloader] = useState(false);

  useEffect(() => {
    if (currentOrgId !== getLocalStorageOrgId()) {
      saveOrgIdToLocalStorage(currentOrgId);
    }
  }, [currentOrgId]);

  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: () => setOpen(false)
  });

  const {
    orgIds,
    orgPermissions: { role }
  } = usePermissions(currentOrgId);
  const { company: defaultCompany } = useMyCompany(currentOrgId);
  const nbOfCompanies = orgIds.length;

  const handleOnClickCompany = (orgId: string) => {
    setOpen(false);
    handleOnResetSearch();
    saveOrgIdToLocalStorage(orgId);
    handleCompanyChange(orgId);
  };

  const { data, loading, error, refetch } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES, { fetchPolicy: "network-only", variables: { first: 10 } });

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
          {current ? (
            <h1 className="company-switcher-item__name">
              {company.givenName || company.name}
            </h1>
          ) : (
            <div className="company-switcher-item__name">
              {company.givenName || company.name}
            </div>
          )}
          {current && nbOfCompanies > 1 && (
            <span
              className="fr-icon-arrow-down-s-line company-switcher-item__arrow"
              aria-hidden="true"
            ></span>
          )}
        </div>
        {role !== UserRole.Driver && (
          <div className="company-switcher-item__infos">
            <div className="company-switcher-item__siret">{company.orgId}</div>
            {current && (
              <p className="company-switcher-item__code fr-tag fr-tag--sm fr-icon-pen-nib-line fr-tag--icon-left">
                <span className="fr-sr-only">
                  Code signature de l'établissement
                </span>
                {company.securityCode}
              </p>
            )}
          </div>
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
          <div className="company-switcher-count">{`${searchCompanies.length} sur ${nbOfCompanies} établissements`}</div>
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
        nbOfCompanies === 1 && "company-switcher--unique"
      }`}
      ref={targetRef as React.RefObject<HTMLDivElement>}
    >
      {displayedItem(
        defaultCompany,
        () => {
          if (nbOfCompanies > 1) setOpen(open => !open);
        },
        true
      )}
      <div className="company-switcher-list">
        {nbOfCompanies > 10 && (
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
