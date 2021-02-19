import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { Query } from "generated/graphql/types";
import { formSearchResultFragment } from "common/fragments";
import { Breadcrumb, BreadcrumbItem } from "common/components";
import { FormSearchResultTable } from "../../FormSearchResultTable";

export const SEARCH_DRAFTS = gql`
  query SearchDrafts($siret: String!) {
    searchForms(siret: $siret, status: ["DRAFT"]) {
      ...FormSearchResultFragment
    }
  }
  ${formSearchResultFragment}
`;

export function RouteSlipsDrafts() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "searchForms">>(SEARCH_DRAFTS, {
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
        <BreadcrumbItem>Brouillons</BreadcrumbItem>
      </Breadcrumb>
      <FormSearchResultTable searchResults={data?.searchForms ?? []} />
    </>
  );
}
