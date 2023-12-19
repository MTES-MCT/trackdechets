import React, { useState, useMemo, useEffect } from "react";
import { gql, useQuery } from "@apollo/client";
import AccountCompany from "./AccountCompany";
import { useNavigate } from "react-router-dom";
import { Query } from "@td/codegen-ui";
import { Loader } from "../Apps/common/Components";
import { NotificationError } from "../Apps/common/Components/Error/Error";
import routes from "../Apps/routes";
import { debounce } from "../common/helper";
import {
  MIN_MY_COMPANIES_SEARCH,
  MAX_MY_COMPANIES_SEARCH
} from "shared/constants";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";

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
  ${AccountCompany.fragments.company}
`;

// Prevent to short and long clues
const isSearchClueValid = clue =>
  clue.length >= MIN_MY_COMPANIES_SEARCH &&
  clue.length <= MAX_MY_COMPANIES_SEARCH;

export default function AccountCompanyList() {
  const [isFiltered, setIsFiltered] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchClue, setSearchClue] = useState("");
  const [displayPreloader, setDisplayPreloader] = useState(false);

  const navigate = useNavigate();

  const { data, loading, error, refetch, fetchMore } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES, { variables: { first: 10 } });

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

      if (!companies || totalCount === 0) {
        if (!isFiltered) {
          // No results and we're not filtering, redirect to the create company screen
          navigate(routes.account.companies.orientation);
        }
      }
    }
  }, [navigate, data, isFiltered]);

  const getPageContent = content => (
    <div className="fr-container-fluid">
      <div className="fr-grid-row mb-4w fr-grid-row--bottom">
        <div className="fr-col-4">
          <Input
            label="Filtrer mes établissements par nom, SIRET ou n° de TVA"
            hintText="Veuillez entrer au minimum 3 caractères"
            nativeInputProps={{
              maxLength: MAX_MY_COMPANIES_SEARCH,
              onChange: e => {
                setInputValue(e.target.value);
                handleOnChangeSearch(e.target.value);
              },
              value: inputValue
            }}
          ></Input>
        </div>
        <div className="fr-col-4 fr-ml-1w">
          <Button
            onClick={handleOnResetSearch}
            disabled={displayPreloader || !searchClue.length}
            nativeButtonProps={{ type: "button" }}
          >
            Effacer le filtre
          </Button>
        </div>
      </div>
      <div className="fr-grid-row fr-mb-2w">
        <div className="fr-col-12">{content}</div>
      </div>
    </div>
  );

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  if (displayPreloader || loading) {
    return getPageContent(<Loader />);
  }

  if (data) {
    const companies = data.myCompanies?.edges.map(({ node }) => node);
    const totalCount = data.myCompanies?.totalCount ?? 0;

    if (!companies || totalCount === 0) {
      if (isFiltered) {
        return getPageContent(
          <div className="tw-mb-3">
            Aucun résultat pour la recherche: {searchClue}
          </div>
        );
      }

      return <Loader />;
    }

    const plural = totalCount > 1 ? "s" : "";
    const listTitle =
      searchClue.length === 0
        ? `Vous êtes membre de ${totalCount} établissement${plural}`
        : `${totalCount} résultat${plural} pour la recherche : ${searchClue}`;

    return getPageContent(
      <>
        <div className="tw-mb-3">{listTitle}</div>
        {companies.map(company => (
          <AccountCompany key={company.orgId} company={company} />
        ))}
        {data.myCompanies?.pageInfo.hasNextPage && (
          <div style={{ textAlign: "center" }}>
            <button
              className="center btn btn--primary small"
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
      </>
    );
  }

  return <Loader />;
}
