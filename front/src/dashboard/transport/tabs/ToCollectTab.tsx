import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { Query } from "generated/graphql/types";
import { formSearchResultFragment } from "common/fragments";
import { FormSearchResultTable } from "../../FormSearchResultTable";

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
export default function ToCollectTab() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "searchForms">>(SEARCH_TO_COLLECT, {
    variables: {
      siret,
    },
  });

  // TODO: blankslate
  // TODO: loading state

  return <FormSearchResultTable searchResults={data?.searchForms ?? []} />;
}
