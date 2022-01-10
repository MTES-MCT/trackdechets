import React from "react";
import { gql, useQuery } from "@apollo/client";
import { filter } from "graphql-anywhere";
import AccountCompany from "./AccountCompany";
import { useRouteMatch, Link } from "react-router-dom";
import { Query } from "generated/graphql/types";
import { Loader } from "common/components";
import { NotificationError } from "common/components/Error";

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
  const { url } = useRouteMatch();

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
    return (
      <>
        {companies && companies.length > 0 ? (
          <>
            <div className="tw-mb-3">
              Vous faites partie de {data.myCompanies?.totalCount}{" "}
              {(data.myCompanies?.totalCount ?? 0) > 1
                ? "établissements"
                : "établissement"}
            </div>
            {companies.map(company => (
              <AccountCompany
                key={company.siret}
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
        ) : (
          <div className="notification success">
            <h5 className="h4 tw-mb-4">
              Vous n'avez pas encore d'établissement
            </h5>
            <p>
              Pour commencer à utiliser Trackdéchets vous devez appartenir à un
              établissement.
            </p>

            <p> Pour ce faire, 2 possibilités:</p>
            <ul className="bullets">
              <li>
                Votre entreprise n'existe pas encore sur Trackdéchets et vous en
                êtes responsable.{" "}
                <Link to={`${url}/new`} className="link">
                  Créez un établissement
                </Link>
              </li>
              <li>
                Votre entreprise existe déjà sur Trackdéchets. Demandez à
                l'administrateur du compte au sein de votre entreprise de vous
                inviter.
              </li>
            </ul>

            <p className="tw-mt-4">
              Dès que vous aurez rejoint un établissement, vous pourrez créer et
              consulter les bordereaux de votre entreprise.
            </p>
          </div>
        )}
      </>
    );
  }

  return null;
}
