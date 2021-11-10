import React from "react";
import { useQuery } from "@apollo/client";
import { Query, QueryBsddRevisionRequestsArgs } from "generated/graphql/types";
import { GET_BSDD_REVISION_REQUESTS } from "./query";
import { useParams } from "react-router-dom";
import { Loader } from "common/components";
import { BsddRevisionRequestTable } from "./BsddRevisionRequestTable";

export function BsddRevisionRequestList() {
  const { siret } = useParams<{ siret: string }>();

  const { data, loading } = useQuery<
    Pick<Query, "bsddRevisionRequests">,
    QueryBsddRevisionRequestsArgs
  >(GET_BSDD_REVISION_REQUESTS, {
    variables: {
      siret,
    },
    fetchPolicy: "cache-and-network",
  });

  if (loading) return <Loader />;

  if (!data?.bsddRevisionRequests) {
    return <div>Vous n'avez aucune révision en attente.</div>;
  }

  return (
    <BsddRevisionRequestTable
      revisions={data.bsddRevisionRequests.edges.map(edge => edge.node)}
    />
  );
}
