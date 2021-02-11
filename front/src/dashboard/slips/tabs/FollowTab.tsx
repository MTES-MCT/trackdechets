import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { Query } from "generated/graphql/types";
import { formSearchResultFragment } from "common/fragments";
import { FormSearchResultTable } from "../../FormSearchResultTable";

// FIXME: missing hasNextStep
export const SEARCH_FOLLOWS = gql`
  query SearchFollows($siret: String!) {
    searchForms(
      siret: $siret
      status: [
        "SEALED"
        "SENT"
        "RECEIVED"
        "ACCEPTED"
        "TEMP_STORED"
        "TEMP_STORER_ACCEPTED"
        "RESEALED"
        "RESENT"
        "AWAITING_GROUP"
        "GROUPED"
      ]
    ) {
      ...FormSearchResultFragment
    }
  }
  ${formSearchResultFragment}
`;

export default function FollowTab() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "searchForms">>(SEARCH_FOLLOWS, {
    variables: {
      siret,
    },
  });

  // TODO: blankslate
  // TODO: loading state

  return <FormSearchResultTable searchResults={data?.searchForms ?? []} />;
}
