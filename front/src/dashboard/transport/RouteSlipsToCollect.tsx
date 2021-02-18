import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { Query } from "generated/graphql/types";
import { formSearchResultFragment } from "common/fragments";
import { Breadcrumb, BreadcrumbItem } from "common/components";
import { FormSearchResultTable } from "../FormSearchResultTable";

export const SEARCH_TO_COLLECT = gql`
  query SearchFollows($siret: String!) {
    searchForms(
      siret: $siret
      status: ["SEALED", "SENT", "RESEALED", "RESENT"]
      waitingForMe: true
    ) {
      ...FormSearchResultFragment
    }
  }
  ${formSearchResultFragment}
`;

// TODO: cards display (persisted in local storage)
export function RouteSlipsToCollect() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "searchForms">>(SEARCH_TO_COLLECT, {
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
        <BreadcrumbItem>À collecter</BreadcrumbItem>
      </Breadcrumb>
      <FormSearchResultTable searchResults={data?.searchForms ?? []} />
    </>
  );
}
