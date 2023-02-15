import React, { useState, useMemo } from "react";
import { gql, useQuery } from "@apollo/client";
import { filter } from "graphql-anywhere";
import AccountCompany from "./AccountCompany";
import { useHistory } from "react-router-dom";
import { Query } from "generated/graphql/types";
import { Loader } from "common/components";
import { NotificationError } from "common/components/Error";
import routes from "common/routes";
import { debounce } from "common/helper";
import {
  MIN_MY_COMPANIES_SEARCH,
  MAX_MY_COMPANIES_SEARCH,
} from "generated/constants/COMPANY_CONSTANTS";
import { Container, Row, Col, TextInput, Button } from "@dataesr/react-dsfr";

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

  const history = useHistory();

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
        search: newSearchClue,
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

  const getPageContent = content => (
    <Container fluid>
      <Row spacing="mb-4w" alignItems={"bottom"}>
        <Col n="4">
          <TextInput
            label="Filtrer mes établissements par nom, SIRET ou n° de TVA"
            hint="Veuillez entrer au minimum 3 caractères"
            maxLength={MAX_MY_COMPANIES_SEARCH}
            onChange={e => {
              setInputValue(e.target.value);
              handleOnChangeSearch(e.target.value);
            }}
            value={inputValue}
          ></TextInput>
        </Col>
        <Col n="4" spacing="ml-1w">
          <Button
            onClick={handleOnResetSearch}
            disabled={displayPreloader || !searchClue.length}
          >
            Effacer le filtre
          </Button>
        </Col>
      </Row>
      <Row spacing="mb-2w">
        <Col n="12">{content}</Col>
      </Row>
    </Container>
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

      // No results and we're not filtering, redirect to the create company screen
      history.push({
        pathname: routes.account.companies.orientation,
      });
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
          <AccountCompany
            key={company.orgId}
            company={filter(AccountCompany.fragments.company, company)}
          />
        ))}
        {data.myCompanies?.pageInfo.hasNextPage && (
          <div style={{ textAlign: "center" }}>
            <button
              className="center btn btn--primary small"
              onClick={() =>
                fetchMore({
                  variables: {
                    first: 10,
                    after: data.myCompanies?.pageInfo.endCursor,
                  },
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
