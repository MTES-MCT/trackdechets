import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { Query, QueryFormRevisionRequestsArgs } from "@td/codegen-ui";
import { GET_FORM_REVISION_REQUESTS } from "../../../../Apps/common/queries/reviews/BsddReviewsQuery";
import { useParams } from "react-router-dom";
import { Loader } from "../../../../Apps/common/Components";
import { BsddRevisionRequestTable } from "./BsddRevisionRequestTable";
import buildUpdateQueryFn from "../fetchMore";

export function BsddRevisionRequestList() {
  const { siret } = useParams<{ siret: string }>();

  const [fetchRevisions, { data, loading, fetchMore }] = useLazyQuery<
    Pick<Query, "formRevisionRequests">,
    QueryFormRevisionRequestsArgs
  >(GET_FORM_REVISION_REQUESTS, {
    variables: {
      siret: siret!
    },
    fetchPolicy: "cache-and-network"
  });

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  if (loading) return <Loader />;

  if (!data?.formRevisionRequests?.edges?.length) {
    return <div>Vous n'avez aucune révision en attente.</div>;
  }

  return (
    <>
      <BsddRevisionRequestTable
        revisions={data.formRevisionRequests.edges.map(edge => edge.node)}
      />
      {data?.formRevisionRequests?.pageInfo?.hasNextPage && (
        <div className="tw-flex tw-justify-center tw-mt-2">
          <button
            className="center btn btn--primary small"
            onClick={() =>
              fetchMore({
                variables: {
                  after: data?.formRevisionRequests.pageInfo.endCursor
                },

                updateQuery: (prev, { fetchMoreResult }) =>
                  buildUpdateQueryFn("formRevisionRequests")(prev, {
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
