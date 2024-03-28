import React, { useState, useMemo, useEffect } from "react";
import { gql, useQuery } from "@apollo/client";
import CompanyDetails from "./CompanyDetails";
import { Link, useNavigate, generatePath } from "react-router-dom";
import { Query, CompanyPrivate, UserRole } from "@td/codegen-ui";
import { Loader } from "../Apps/common/Components";
import { NotificationError } from "../Apps/common/Components/Error/Error";
import routes from "../Apps/routes";
import { debounce } from "../common/helper";
import {
  MIN_MY_COMPANIES_SEARCH,
  MAX_MY_COMPANIES_SEARCH
} from "@td/constants";
import styles from "./CompaniesList.module.scss";
import AccountContentWrapper from "../account/AccountContentWrapper";

export const MY_COMPANIES = gql`
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
          ...AccountCompanyFragment
        }
      }
    }
  }
  ${CompanyDetails.fragments.company}
`;

// Prevent to short and long clues
const isSearchClueValid = clue =>
  clue.length >= MIN_MY_COMPANIES_SEARCH &&
  clue.length <= MAX_MY_COMPANIES_SEARCH;

export const userRole = (role: UserRole) => {
  let icon = "fr-icon-user-line";
  let roleLabel = "";

  switch (role) {
    case UserRole.Admin:
      icon = "fr-icon-admin-line";
      roleLabel = "Administrateur";
      break;
    case UserRole.Driver:
      roleLabel = "Chauffeur";
      break;
    case UserRole.Member:
      roleLabel = "Collaborateur";
      break;
    case UserRole.Reader:
      roleLabel = "Lecteur";
      break;
  }

  return (
    <>
      <span className={`${styles.icon} ${icon}`} aria-hidden="true" />
      {roleLabel}
    </>
  );
};

export default function CompaniesList() {
  const [isFiltered, setIsFiltered] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchClue, setSearchClue] = useState("");
  const [displayPreloader, setDisplayPreloader] = useState(false);
  const [userCompaniesTotalCount, setUserCompaniesTotalCount] = useState(0);

  const navigate = useNavigate();

  const { data, loading, error, refetch, fetchMore } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES, { fetchPolicy: "network-only", variables: { first: 10 } });

  const debouncedSearch = useMemo(
    () =>
      debounce(params => {
        setSearchClue(params.search);
        refetch(params).then(() => setDisplayPreloader(false));
      }, 1000),
    [refetch, setDisplayPreloader]
  );

  const handleOnChangeSearch = newSearchClue => {
    if (isSearchClueValid(newSearchClue)) {
      setDisplayPreloader(true);
      setIsFiltered(true);
      debouncedSearch({
        search: newSearchClue
      });
    }

    if (newSearchClue.length === 0) {
      handleOnResetSearch();
    }
  };

  const handleOnResetSearch = () => {
    setInputValue("");
    setDisplayPreloader(true);
    setIsFiltered(false);
    debouncedSearch({ search: "" });
  };

  useEffect(() => {
    if (data) {
      const companies = data.myCompanies?.edges.map(({ node }) => node);
      const totalCount = data.myCompanies?.totalCount ?? 0;

      setUserCompaniesTotalCount(previousTotalCount => {
        return previousTotalCount || totalCount;
      });

      if (!companies || (userCompaniesTotalCount === 0 && totalCount === 0)) {
        if (!isFiltered) {
          // No results and we're not filtering, redirect to the create company screen
          navigate(routes.companies.orientation);
        }
      }
    }
  }, [
    navigate,
    data,
    isFiltered,
    userCompaniesTotalCount,
    setUserCompaniesTotalCount
  ]);

  const pluralize = count => (count > 1 ? "s" : "");
  const listTitle = `Vous êtes membre de ${userCompaniesTotalCount} établissement${pluralize(
    userCompaniesTotalCount
  )}`;

  const getPageContent = (content, subtitle?) => (
    <AccountContentWrapper
      title="Établissements"
      subtitle={subtitle}
      additional={
        <Link className="fr-btn" to={routes.companies.orientation}>
          Créer un établissement
        </Link>
      }
    >
      <div className="fr-container--fluid">
        <div className="fr-grid-row mb-4w fr-grid-row--bottom">
          <div className="fr-col-12">
            <div
              className="fr-search-bar fr-search-bar--lg"
              id="companies-search"
              role="search"
            >
              <label className="fr-label" htmlFor="search-my-companies">
                Recherche
              </label>
              <input
                className="fr-input"
                placeholder="Rechercher un établissement"
                type="search"
                id="search-my-companies"
                name="search-my-companies"
                maxLength={MAX_MY_COMPANIES_SEARCH}
                onChange={e => {
                  setInputValue(e.target.value);
                  handleOnChangeSearch(e.target.value);
                }}
                value={inputValue}
              />
              <button
                className={`fr-btn ${isFiltered ? styles.cancel : ""}`}
                title="Rechercher"
                disabled={displayPreloader}
                onClick={() => (isFiltered ? handleOnResetSearch() : () => {})}
              >
                {isFiltered ? "Annuler" : "Rechercher"}
              </button>
            </div>
          </div>
        </div>
        <div className="fr-grid-row fr-mb-2w">
          <div className="fr-col-12">{content}</div>
        </div>
      </div>
    </AccountContentWrapper>
  );

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  if (displayPreloader || loading) {
    return getPageContent(<Loader />, listTitle);
  }

  if (data) {
    const companies = data.myCompanies?.edges.map(({ node }) => node);
    const totalCount = data.myCompanies?.totalCount ?? 0;

    const searchTitle = `${totalCount} résultat${pluralize(
      totalCount
    )} pour la recherche : ${searchClue}`;

    if (!companies || totalCount === 0) {
      if (isFiltered) {
        return getPageContent(
          <div className="tw-mb-3">
            Aucun résultat pour la recherche: {searchClue}
          </div>,
          listTitle
        );
      }

      return <Loader />;
    }

    const renderCompanies = companies => {
      return companies.map((company: CompanyPrivate) => (
        <Link
          to={{
            pathname: generatePath(routes.companies.details, {
              siret: company.orgId
            })
          }}
          className={styles.item}
          key={company.orgId}
        >
          <div data-testid="companies-list">
            <p className={`fr-text ${styles.name}`}>
              {company.name}
              {company.givenName && ` - ${company.givenName}`}
            </p>
            <p className="fr-text">{company.orgId}</p>
            <p className="fr-text">{company.address}</p>
            <p className={`${styles.role} fr-text`}>
              {userRole(company.userRole!)}
            </p>
          </div>
          <span
            className={`fr-icon-arrow-down-s-line ${styles.arrow}`}
            aria-hidden="true"
          />
        </Link>
      ));
    };

    return getPageContent(
      <div className="fr-mt-4w">
        {isFiltered && <div className="fr-mb-2w">{searchTitle}</div>}
        <div>{renderCompanies(companies)}</div>
        {data.myCompanies?.pageInfo.hasNextPage && (
          <div style={{ textAlign: "center" }}>
            <button
              className="fr-btn"
              onClick={() =>
                fetchMore({
                  variables: {
                    first: 10,
                    after: data.myCompanies?.pageInfo.endCursor
                  }
                })
              }
            >
              Charger plus d'établissements
            </button>
          </div>
        )}
      </div>,
      listTitle
    );
  }

  return <Loader />;
}
