import React from "react";
import { gql, useQuery } from "@apollo/client";
import { filter } from "graphql-anywhere";
import AccountCompany from "./AccountCompany";
import { useRouteMatch, Link } from "react-router-dom";
import { Query } from "generated/graphql/types";
import { Loader } from "common/components";
import { NotificationError } from "common/components/Error";

export const MY_COMPANIES = gql`
  query MyCompanies($first: Int, $after: string) {
    myCompanies(first: $first, after: $after) {
      ...AccountCompanyFragment
    }
  }
  ${AccountCompany.fragments.company}
`;

export default function AccountCompanyList() {
  const { url } = useRouteMatch();

  const { data, loading, error, fetchMore } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES);

  if (loading) {
    return <Loader />;
  }

  {
    error && <NotificationError apolloError={error} />;
  }

  const companies = data?.myCompanies?.edges.map(({ node }) => node);

  return (
    <>
      {companies && companies.length > 0 ? (
        companies.map(company => (
          <AccountCompany
            key={company.siret}
            company={filter(AccountCompany.fragments.company, company)}
          />
        ))
      ) : (
        <div className="notification success">
          <h5 className="h4 tw-mb-4">Vous n'avez pas encore d'établissement</h5>
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
