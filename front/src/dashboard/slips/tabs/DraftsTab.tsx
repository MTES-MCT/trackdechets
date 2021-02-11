import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { Query } from "generated/graphql/types";
import { formSearchResultFragment } from "common/fragments";
import { FormSearchResultTable } from "../../FormSearchResultTable";

export const SEARCH_DRAFTS = gql`
  query SearchDrafts($siret: String!) {
    searchForms(siret: $siret, status: ["DRAFT"]) {
      ...FormSearchResultFragment
    }
  }
  ${formSearchResultFragment}
`;

export default function DraftsTab() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "searchForms">>(SEARCH_DRAFTS, {
    variables: {
      siret,
    },
  });

  // TODO: blankslate
  // TODO: loading state

  return <FormSearchResultTable searchResults={data?.searchForms ?? []} />;
}
