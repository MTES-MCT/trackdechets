import React, { useState, useMemo } from "react";
import { DocumentNode, useQuery } from "@apollo/client";
import {
  Query,
  CompanyPrivate,
  QueryMyCompaniesArgs,
  CompanyPrivateConnection
} from "@td/codegen-ui";
import { Loader } from "../../common/Components";
import { NotificationError } from "../../common/Components/Error/Error";
import { debounce } from "../../../common/helper";
import {
  MIN_MY_COMPANIES_SEARCH,
  MAX_MY_COMPANIES_SEARCH
} from "@td/constants";
import styles from "./CompaniesList.module.scss";
import { MY_COMPANIES } from "./queries";

type SearchableCompaniesListProps = {
  // fragment sur CompanyPrivate permettant de spécifier les champs requis
  // à fetch pour l'affichage des établissements dans la liste
  fragment: DocumentNode;
  renderCompanies: (
    companies: CompanyPrivate[],
    totalCount: number
  ) => React.ReactNode;
  // ocallback qui est appelé à chaque fois que l'on obtient une réponse
  // de la query `myCompanies`
  onCompleted?: (data: CompanyPrivateConnection, isFiltered: boolean) => void;
};

// Prevent too short and long clues
const isSearchClueValid = clue =>
  clue.length >= MIN_MY_COMPANIES_SEARCH &&
  clue.length <= MAX_MY_COMPANIES_SEARCH;

/**
 * Composant abstrait permettant l'affichage d'une liste d'établissement
 * paginé (par curseur de type "Charger plus") avec une barre de recherche.
 */
export default function SearchableCompaniesList({
  renderCompanies,
  onCompleted,
  fragment
}: SearchableCompaniesListProps) {
  const [isFiltered, setIsFiltered] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchClue, setSearchClue] = useState("");
  const [displayPreloader, setDisplayPreloader] = useState(false);

  const { data, loading, error, refetch, fetchMore } = useQuery<
    Pick<Query, "myCompanies">,
    QueryMyCompaniesArgs
  >(MY_COMPANIES(fragment), {
    fetchPolicy: "network-only",
    variables: { first: 10 },
    onCompleted: data =>
      onCompleted && onCompleted(data.myCompanies, isFiltered)
  });

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

  const pluralize = count => (count > 1 ? "s" : "");

  const renderSearchableCompaniesList = (
    myCompanies: CompanyPrivateConnection
  ) => {
    const companies = myCompanies.edges.map(({ node }) => node);
    const totalCount = myCompanies.totalCount;
    const searchTitle = `${totalCount} résultat${pluralize(
      totalCount
    )} pour la recherche : ${searchClue}`;

    if (!companies || totalCount === 0) {
      if (isFiltered) {
        return (
          <div className="tw-mb-3">
            Aucun résultat pour la recherche : {searchClue}
          </div>
        );
      }
      return <Loader />;
    }

    return (
      <div className="fr-mt-4w">
        {isFiltered && <div className="fr-mb-2w">{searchTitle}</div>}
        {/* <div>{companies.map(company => renderCompanies(company))}</div> */}
        {renderCompanies(companies, totalCount)}
        {myCompanies.pageInfo.hasNextPage && (
          <div style={{ textAlign: "center" }}>
            <button
              className="fr-btn"
              onClick={() =>
                fetchMore({
                  variables: {
                    first: 10,
                    after: myCompanies.pageInfo.endCursor
                  }
                })
              }
            >
              Charger plus d'établissements
            </button>
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  if (data) {
    return (
      <div className="fr-container--fluid">
        <div className="fr-grid-row mb-4w fr-grid-row--bottom">
          <div className="fr-col-12 fr-p-1w">
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
          <div className="fr-col-12">
            {displayPreloader || loading ? (
              <Loader />
            ) : (
              renderSearchableCompaniesList(data.myCompanies)
            )}
          </div>
        </div>
      </div>
    );
  }

  return <Loader />;
}
