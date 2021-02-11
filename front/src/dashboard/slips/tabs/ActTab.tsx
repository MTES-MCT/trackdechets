import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { Query } from "generated/graphql/types";
import { formSearchResultFragment } from "common/fragments";
import { FormSearchResultTable } from "../../FormSearchResultTable";

// FIXME: missing hasNextStep
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
    ) {
      ...FormSearchResultFragment
    }
  }
  ${formSearchResultFragment}
`;

export default function ActTab() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "searchForms">>(SEARCH_ACTS, {
    variables: {
      siret,
    },
  });

  // TODO: blankslate
  // TODO: loading state

  return <FormSearchResultTable searchResults={data?.searchForms ?? []} />;
}
