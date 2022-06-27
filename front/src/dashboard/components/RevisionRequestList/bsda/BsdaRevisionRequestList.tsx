import React from "react";
import { useQuery } from "@apollo/client";
import { Query, QueryBsdaRevisionRequestsArgs } from "generated/graphql/types";
import { GET_BSDA_REVISION_REQUESTS } from "./query";
import { useParams } from "react-router-dom";
import { Loader } from "common/components";
import { BsdaRevisionRequestTable } from "./BsdaRevisionRequestTable";

export function BsdaRevisionRequestList() {
  const { siret } = useParams<{ siret: string }>();

  const { data, loading } = useQuery<
    Pick<Query, "bsdaRevisionRequests">,
    QueryBsdaRevisionRequestsArgs
  >(GET_BSDA_REVISION_REQUESTS, {
    variables: {
      siret,
    },
    fetchPolicy: "cache-and-network",
  });

  if (loading) return <Loader />;

  if (!data?.bsdaRevisionRequests?.edges?.length) {
    return <div>Vous n'avez aucune révision en attente.</div>;
  }

  return (
    <BsdaRevisionRequestTable
      revisions={data.bsdaRevisionRequests.edges.map(edge => edge.node)}
    />
  );
}
