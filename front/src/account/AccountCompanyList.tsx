import React from "react";
import { gql, useQuery } from "@apollo/client";
import { filter } from "graphql-anywhere";
import AccountCompany from "./AccountCompany";
import { useHistory } from "react-router-dom";
import { Query } from "generated/graphql/types";
import { Loader } from "common/components";
import { NotificationError } from "common/components/Error";
import routes from "common/routes";

export const MY_COMPANIES = gql`
  query MyCompanies($first: Int, $after: ID) {
    myCompanies(first: $first, after: $after) {
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
  const history = useHistory();

  const { data, loading, error, fetchMore } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES, { variables: { first: 10 } });

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  if (data) {
    const companies = data.myCompanies?.edges.map(({ node }) => node);

    if (!companies || companies.length === 0) {
      history.push({
        pathname: routes.account.companies.orientation,
      });
    } else {
      return (
        <>
          <div className="tw-mb-3">
            Vous êtes membre de {data.myCompanies?.totalCount}{" "}
            {(data.myCompanies?.totalCount ?? 0) > 1
              ? "établissements"
              : "établissement"}
          </div>
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

  return null;
}
