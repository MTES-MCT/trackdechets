import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { FormStatus, Query } from "generated/graphql/types";

const GET_DRAFTS = gql`
  query GetDrafts($siret: String!, $status: [String!]!) {
    searchForms(siret: $siret, status: $status) {
      id
      readableId
      recipientCompany {
        siret
        name
      }
    }
  }
`;

export default function DraftsTab() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "searchForms">>(GET_DRAFTS, {
    variables: {
      siret,
      status: [FormStatus.Draft],
    },
  });

  return (
    <ul>
      {data?.searchForms.map(form => (
        <li key={form.id}>{form.readableId}</li>
      ))}
    </ul>
  );
}
