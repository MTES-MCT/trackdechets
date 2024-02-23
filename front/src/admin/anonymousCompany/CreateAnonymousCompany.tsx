import * as React from "react";
import { gql, useQuery } from "@apollo/client";
import { Query, QueryAnonymousCompanyRequestArgs } from "@td/codegen-ui";
import { Loader } from "../../Apps/common/Components";
import { useEffect } from "react";
import { PDFViewer } from "./PDFViewer";
import { CreateAnonymousCompanyForm } from "./CreateAnonymousCompanyForm";
import Alert from "@codegouvfr/react-dsfr/Alert";
import styles from "./AnonymousCompany.module.scss";

export const MISSING_COMPANY_SIRET = "Le siret de l'entreprise est obligatoire";

const ANONYMOUS_COMPANY_REQUEST = gql`
  query AnonymousCompanyRequest($id: ID!) {
    anonymousCompanyRequest(id: $id) {
      id
      siret
      pdf
      createdAt
      userId
      name
      codeNaf
      address
      codeCommune
    }
  }
`;

export function CreateAnonymousCompany({
  anonymousCompanyRequestId,
  onCompanyCreated
}) {
  const { data, error, loading, refetch } = useQuery<
    Pick<Query, "anonymousCompanyRequest">,
    QueryAnonymousCompanyRequestArgs
  >(ANONYMOUS_COMPANY_REQUEST, {
    variables: {
      id: anonymousCompanyRequestId
    },
    skip: !Boolean(anonymousCompanyRequestId)
  });

  useEffect(() => {
    refetch({ id: anonymousCompanyRequestId });
  }, [anonymousCompanyRequestId, refetch]);

  if (loading) {
    return (
      <div className={styles.minHeight30vh}>
        <Loader />
      </div>
    );
  }

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
    <div className={`fr-container--fluid ${styles.h100}`}>
      <div className={`fr-grid-row fr-grid-row--gutters ${styles.h100}`}>
        {data?.anonymousCompanyRequest && (
          <div className="fr-col-12 fr-col-lg-6">
            <PDFViewer pdf={data?.anonymousCompanyRequest.pdf} />
          </div>
        )}

        <div className="fr-col-12 fr-col-lg-6">
          <CreateAnonymousCompanyForm
            onCompanyCreated={onCompanyCreated}
            anonymousCompanyRequest={data?.anonymousCompanyRequest}
          />
        </div>
      </div>
    </div>
  );
}
