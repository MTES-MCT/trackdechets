import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { FormStatus, Query } from "generated/graphql/types";
import { FormSearchResultTable } from "../../FormSearchResultTable";

const SEARCH_DRAFTS = gql`
  query SearchDrafts($siret: String!, $status: [String!]!) {
    searchForms(siret: $siret, status: $status) {
      id
      readableId
      type
      status
      emitter
      recipient
      waste
      sirets
    }
  }
`;

export default function DraftsTab() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "searchForms">>(SEARCH_DRAFTS, {
    variables: {
      siret,
      status: [FormStatus.Draft],
    },
  });

  return <FormSearchResultTable searchResults={data?.searchForms ?? []} />;
}
