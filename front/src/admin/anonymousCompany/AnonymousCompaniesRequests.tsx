import { gql, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import React from "react";
import { Query } from "@td/codegen-ui";
import { AnonymousCompaniesRequestsPagination } from "./AnonymousCompaniesRequestsPagination";

const ANONYMOUS_COMPANY_REQUESTS = gql`
  query AnonymousCompanyRequests($first: Int, $last: Int, $skip: Int) {
    anonymousCompanyRequests(first: $first, last: $last, skip: $skip) {
      totalCount
      anonymousCompanyRequests {
        id
        siret
        createdAt
        userId
        name
        codeNaf
        address
      }
    }
  }
`;

const REQUESTS_PER_PAGE = 10;

export const AnonymousCompaniesRequests = () => {
  const { loading, error, data, refetch } = useQuery<
    Pick<Query, "anonymousCompanyRequests">
  >(ANONYMOUS_COMPANY_REQUESTS, {
    variables: { first: REQUESTS_PER_PAGE, skip: 0 }
  });

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <h3 className="fr-h3">Entreprises anonymes</h3>

        <div>
          <Button
            iconId="fr-icon-add-line"
            onClick={function noRefCheck() {}}
            priority="secondary"
          >
            Créer une entreprise
          </Button>
        </div>
      </div>
      <Table
        data={
          data?.anonymousCompanyRequests.anonymousCompanyRequests.map(
            request => [request.siret, request.name, "", ""]
          ) ?? []
        }
        headers={["SIRET", "Raison sociale", "Mail", "Action"]}
        fixed
        noCaption
      />

      <AnonymousCompaniesRequestsPagination
        totalCount={data?.anonymousCompanyRequests.totalCount}
        countPerPage={REQUESTS_PER_PAGE}
        refetch={refetch}
      />
    </>
  );
};
