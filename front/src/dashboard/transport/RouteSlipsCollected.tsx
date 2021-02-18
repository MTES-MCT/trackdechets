import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { Query } from "generated/graphql/types";
import { formSearchResultFragment } from "common/fragments";
import { Breadcrumb, BreadcrumbItem } from "common/components";
import { FormSearchResultTable } from "../FormSearchResultTable";

export const SEARCH_COLLECTED = gql`
  query SearchFollows($siret: String!) {
    searchForms(
      siret: $siret
      status: ["SEALED", "SENT", "RESEALED", "RESENT"]
      waitingForMe: false
    ) {
      ...FormSearchResultFragment
    }
  }
  ${formSearchResultFragment}
`;

// TODO: cards display (persisted in local storage)
export function RouteSlipsCollected() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "searchForms">>(SEARCH_COLLECTED, {
    variables: {
      siret,
    },
  });

  // TODO: blankslate
  // TODO: loading state

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Transport</BreadcrumbItem>
        <BreadcrumbItem>
          Chargés, en attente de réception ou de transfert
        </BreadcrumbItem>
      </Breadcrumb>
      <FormSearchResultTable searchResults={data?.searchForms ?? []} />
    </>
  );
}
