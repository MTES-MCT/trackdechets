import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { Query } from "generated/graphql/types";
import { formSearchResultFragment } from "common/fragments";
import { FormSearchResultTable } from "../../FormSearchResultTable";

export const SEARCH_ARCHIVES = gql`
  query SearchFollows($siret: String!) {
    searchForms(
      siret: $siret
      status: ["PROCESSED", "NO_TRACEABILITY", "REFUSED"]
    ) {
      ...FormSearchResultFragment
    }
  }
  ${formSearchResultFragment}
`;

export default function HistoryTab() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "searchForms">>(SEARCH_ARCHIVES, {
    variables: {
      siret,
    },
  });

  // TODO: blankslate
  // TODO: loading state

  return <FormSearchResultTable searchResults={data?.searchForms ?? []} />;
}
