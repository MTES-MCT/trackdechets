import React, { useEffect, useState, useMemo } from "react";
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
  const [searchClue, setSearchClue] = useState("");
  const [startSearch, setStartSearch] = useState(false);

  const history = useHistory();

  const { data, loading, error, refetch, fetchMore } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES, { variables: { first: 10 } });

  const debouncedSearch = useMemo(
    () =>
      debounce(params => {
        refetch(params);
        setStartSearch(false);
      }, 1000),
    [refetch, setStartSearch]
  );

  useEffect(() => {
    if (isSearchClueValid(searchClue)) {
      debouncedSearch({
        search: searchClue,
      });
    }
  }, [searchClue, debouncedSearch]);

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  let content;

  if (startSearch || loading) {
    content = <Loader />;
  } else if (data) {
    const companies = data.myCompanies?.edges.map(({ node }) => node);

    const totalCount = data.myCompanies?.totalCount ?? 0;

    if (!companies || companies.length === 0) {
      if (totalCount === 0 && searchClue.length === 0) {
        history.push({
          pathname: routes.account.companies.orientation,
        });
      } else {
        content = (
          <div className="tw-mb-3">
            Aucun résultat pour la recherche: {searchClue}
          </div>
        );
      }
    } else {
      let listTitle;
      const plural = totalCount > 1 ? "s" : "";

      if (searchClue.length === 0) {
        listTitle = `Vous êtes membre de ${totalCount} établissement${plural}`;
      } else {
        listTitle = `${totalCount} résultat${plural} pour la recherche : ${searchClue}`;
      }

      content = (
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
  }

  return (
    <Container fluid>
      <Row spacing="mb-4w" alignItems={"bottom"}>
        <Col n="6">
          <TextInput
            label="Filtrer mes établissements"
            hint="Vous pouvez utiliser le nom officiel ou usuel, le n° de siret ou le n° de TVA"
            maxLength={MAX_MY_COMPANIES_SEARCH}
            onChange={e => {
              if (isSearchClueValid(e.target.value)) {
                setStartSearch(true);
              }

              setSearchClue(e.target.value);
            }}
            value={searchClue}
          ></TextInput>
        </Col>
        <Col n="4" spacing="ml-1w">
          <Button
            onClick={() => {
              setStartSearch(true);
              setSearchClue("");
            }}
            disabled={!searchClue.length}
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
}
