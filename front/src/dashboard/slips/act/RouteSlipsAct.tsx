import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { Query } from "generated/graphql/types";
import { formSearchResultFragment } from "common/fragments";
import { Breadcrumb, BreadcrumbItem } from "common/components";
import { FormSearchResultTable } from "../../FormSearchResultTable";

export const SEARCH_ACTS = gql`
  query SearchFollows($siret: String!) {
    searchForms(
      siret: $siret
      status: [
        "SENT"
        "RECEIVED"
        "ACCEPTED"
        "TEMP_STORED"
        "TEMP_STORER_ACCEPTED"
        "RESENT"
      ]
      waitingForMe: true
    ) {
      ...FormSearchResultFragment
    }
  }
  ${formSearchResultFragment}
`;

export function RouteSlipsAct() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "searchForms">>(SEARCH_ACTS, {
    variables: {
      siret,
    },
  });

  // TODO: blankslate
  // TODO: loading state

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Mes bordereaux</BreadcrumbItem>
        <BreadcrumbItem>Pour action</BreadcrumbItem>
      </Breadcrumb>
      <FormSearchResultTable searchResults={data?.searchForms ?? []} />
    </>
  );
}
