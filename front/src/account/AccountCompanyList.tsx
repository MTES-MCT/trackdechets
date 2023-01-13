import React, { useEffect, useState, useCallback } from "react";
import { gql, useQuery } from "@apollo/client";
import { filter } from "graphql-anywhere";
import AccountCompany from "./AccountCompany";
import { useHistory } from "react-router-dom";
import { Query } from "generated/graphql/types";
import { Loader } from "common/components";
import { NotificationError } from "common/components/Error";
import routes from "common/routes";
import debounce from "lodash.debounce";

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

export default function AccountCompanyList() {
  const [searchClue, setSearchClue] = useState("");
  const [startSearch, setStartSearch] = useState(false);

  const history = useHistory();

  const { data, loading, error, refetch, fetchMore } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES, { variables: { first: 10 } });

  const debouncedSearch = useCallback(
    debounce(params => {
      refetch(params);
      setStartSearch(false);
    }, 1000),
    [setStartSearch, refetch]
  );

  useEffect(() => {
    debouncedSearch({
      search: searchClue,
    });
  }, [debouncedSearch, searchClue]);

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  let content;

  if (startSearch || loading) {
    content = <Loader />;
  } else if (data) {
    const companies = data.myCompanies?.edges.map(({ node }) => node);

    if (!companies || companies.length === 0) {
      if (data.myCompanies?.totalCount === 0 && searchClue.length === 0) {
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
      const plural = (data.myCompanies?.totalCount ?? 0) > 1 ? "s" : "";

      if (searchClue.length === 0) {
        listTitle = `Vous êtes membre de ${data.myCompanies?.totalCount} établissement${plural}`;
      } else {
        listTitle = `${data.myCompanies?.totalCount} résultat${plural} pour la recherche: ${searchClue}`;
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
            label="Filtrer mes établissement"
            hint="Vous pouvez utiliser le nom, le n° de siret ou le n° de TVA"
            onChange={e => {
              setStartSearch(true);
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
