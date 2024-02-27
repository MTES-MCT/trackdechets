import { gql, useMutation, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import React from "react";
import {
  Mutation,
  MutationDeleteAnonymousCompanyRequestArgs,
  Query
} from "@td/codegen-ui";
import { AnonymousCompaniesRequestsPagination } from "./AnonymousCompaniesRequestsPagination";
import Alert from "@codegouvfr/react-dsfr/Alert";
import styles from "./AnonymousCompany.module.scss";
import toast from "react-hot-toast";
import { TOAST_DURATION } from "../../common/config";

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
        codeCommune
        user {
          email
        }
      }
    }
  }
`;

const DELETE_ANONYMOUS_COMPANY_REQUEST = gql`
  mutation DeleteAnonymousCompanyRequest($siret: String!) {
    deleteAnonymousCompanyRequest(siret: $siret)
  }
`;

const REQUESTS_PER_PAGE = 50;

export const AnonymousCompaniesRequests = ({ onCreateAnonymousCompany }) => {
  const { error, data, refetch } = useQuery<
    Pick<Query, "anonymousCompanyRequests">
  >(ANONYMOUS_COMPANY_REQUESTS, {
    variables: { first: REQUESTS_PER_PAGE, skip: 0 }
  });
  const [deleteAnonymousCompanyRequest, { loading }] = useMutation<
    Pick<Mutation, "deleteAnonymousCompanyRequest">,
    MutationDeleteAnonymousCompanyRequestArgs
  >(DELETE_ANONYMOUS_COMPANY_REQUEST, {
    onCompleted: () => {
      toast.success("Demande supprimée", { duration: TOAST_DURATION });
      refetch();
    },
    onError: () => {
      toast.error("La demande n'a pas pu être supprimée", {
        duration: TOAST_DURATION
      });
    }
  });

  const tableData =
    data?.anonymousCompanyRequests.anonymousCompanyRequests.map(request => [
      request.siret,
      request.name,
      request.address,
      request.codeNaf,
      request.codeCommune,
      <a className={styles.blueFrance} href={`mailto:${request.user.email}`}>
        {request.user.email}
      </a>,
      <div className={styles.actionButton}>
        <Button
          priority="secondary"
          iconId="fr-icon-delete-bin-line"
          onClick={() =>
            deleteAnonymousCompanyRequest({
              variables: { siret: request.siret }
            })
          }
          title="Supprimer"
          size="large"
          className="fr-mx-1w"
          disabled={loading}
        />{" "}
        <Button
          onClick={() => onCreateAnonymousCompany(request.siret)}
          priority="primary"
        >
          Vérifier
        </Button>
      </div>
    ]) ?? [];

  const tableHeaders = [
    "SIRET",
    "Raison sociale",
    "Adresse",
    "Code NAF",
    "Code commune",
    "Mail",
    "Action"
  ];

  if (error) {
    return (
      <Alert
        title={"Une erreur inattendue s'est produite"}
        description={error.message}
        severity="error"
      />
    );
  }

  return (
    <>
      <div className={styles.tableHeader}>
        <h3 className="fr-h3">Entreprises anonymes</h3>

        <div>
          <Button
            iconId="fr-icon-add-line"
            onClick={() => onCreateAnonymousCompany()}
            priority="secondary"
          >
            Créer une entreprise
          </Button>
        </div>
      </div>

      <Table data={tableData} headers={tableHeaders} fixed noCaption />

      <AnonymousCompaniesRequestsPagination
        totalCount={data?.anonymousCompanyRequests.totalCount}
        countPerPage={REQUESTS_PER_PAGE}
        refetch={refetch}
      />
    </>
  );
};
