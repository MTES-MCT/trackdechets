import React from "react";
import { useQuery } from "@apollo/client";
import {
  Query,
  QueryFormRevisionRequestsArgs
} from "@trackdechets/codegen/src/front.gen";
import { GET_FORM_REVISION_REQUESTS } from "./query";
import { useParams } from "react-router-dom";
import { Loader } from "common/components";
import { BsddRevisionRequestTable } from "./BsddRevisionRequestTable";

export function BsddRevisionRequestList() {
  const { siret } = useParams<{ siret: string }>();

  const { data, loading } = useQuery<
    Pick<Query, "formRevisionRequests">,
    QueryFormRevisionRequestsArgs
  >(GET_FORM_REVISION_REQUESTS, {
    variables: {
      siret
    },
    fetchPolicy: "cache-and-network"
  });

  if (loading) return <Loader />;

  if (!data?.formRevisionRequests?.edges?.length) {
    return <div>Vous n'avez aucune révision en attente.</div>;
  }

  return (
    <BsddRevisionRequestTable
      revisions={data.formRevisionRequests.edges.map(edge => edge.node)}
    />
  );
}
