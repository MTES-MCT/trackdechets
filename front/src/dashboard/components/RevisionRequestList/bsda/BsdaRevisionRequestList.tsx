import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { Query, QueryBsdaRevisionRequestsArgs } from "codegen-ui";
import { GET_BSDA_REVISION_REQUESTS } from "../../../../Apps/common/queries/reviews/BsdaReviewQuery";
import { useParams } from "react-router-dom";
import { Loader } from "../../../../Apps/common/Components";
import { BsdaRevisionRequestTable } from "./BsdaRevisionRequestTable";
import buildUpdateQueryFn from "../fetchMore";
export function BsdaRevisionRequestList() {
  const { siret } = useParams<{ siret: string }>();

  const [fetchRevisions, { data, loading, fetchMore }] = useLazyQuery<
    Pick<Query, "bsdaRevisionRequests">,
    QueryBsdaRevisionRequestsArgs
  >(GET_BSDA_REVISION_REQUESTS, {
    variables: {
      siret: siret!
    },
    fetchPolicy: "cache-and-network"
  });
  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  if (loading) return <Loader />;

  if (!data?.bsdaRevisionRequests?.edges?.length) {
    return <div>Vous n'avez aucune révision en attente.</div>;
  }

  return (
    <>
      <BsdaRevisionRequestTable
        revisions={data.bsdaRevisionRequests.edges.map(edge => edge.node)}
      />
      {data?.bsdaRevisionRequests?.pageInfo?.hasNextPage && (
        <div className="tw-flex tw-justify-center tw-mt-2">
          <button
            className="center btn btn--primary small"
            onClick={() =>
              fetchMore({
                variables: {
                  after: data?.bsdaRevisionRequests.pageInfo.endCursor
                },

                updateQuery: (prev, { fetchMoreResult }) =>
                  buildUpdateQueryFn("bsdaRevisionRequests")(prev, {
                    fetchMoreResult
                  })
              })
            }
          >
            Charger plus de révisions
          </button>
        </div>
      )}
    </>
  );
}
