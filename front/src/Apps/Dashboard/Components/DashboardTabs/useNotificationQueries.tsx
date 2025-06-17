import { gql, useQuery } from "@apollo/client";
import { useMemo } from "react";
import { Query, QueryBsdsArgs } from "@td/codegen-ui";

const NOTIFICATION_QUERY = gql`
  query GetBsds($where: BsdWhere) {
    bsds(first: 1, where: $where) {
      totalCount
    }
  }
`;

export function useNotificationQueries(orgId: string) {
  const queryAction = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(
    NOTIFICATION_QUERY,
    { variables: { where: { isForActionFor: [orgId] } } }
  );

  const queryTransport = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(
    NOTIFICATION_QUERY,
    { variables: { where: { isToCollectFor: [orgId] } } }
  );

  const queryIsEmittedRevisionFor = useQuery<
    Pick<Query, "bsds">,
    QueryBsdsArgs
  >(NOTIFICATION_QUERY, {
    variables: { where: { isEmittedRevisionFor: [orgId] } }
  });

  const queryIsReceivedRevisionFor = useQuery<
    Pick<Query, "bsds">,
    QueryBsdsArgs
  >(NOTIFICATION_QUERY, {
    variables: { where: { isReceivedRevisionFor: [orgId] } }
  });

  const loading =
    queryAction.loading ||
    queryTransport.loading ||
    queryIsEmittedRevisionFor.loading ||
    queryIsReceivedRevisionFor.loading;

  const data = useMemo(
    () => ({
      actionCount: queryAction.data?.bsds.totalCount ?? 0,
      transportCount: queryTransport.data?.bsds.totalCount ?? 0,
      isEmittedRevisionForCount:
        queryIsEmittedRevisionFor.data?.bsds.totalCount ?? 0,
      isReceivedRevisionForCount:
        queryIsReceivedRevisionFor.data?.bsds.totalCount ?? 0
    }),
    [
      queryAction.data?.bsds.totalCount,
      queryTransport.data?.bsds.totalCount,
      queryIsEmittedRevisionFor.data?.bsds.totalCount,
      queryIsReceivedRevisionFor.data?.bsds.totalCount
    ]
  );

  const refetchAll = () => {
    queryAction.refetch();
    queryTransport.refetch();
    queryIsEmittedRevisionFor.refetch();
    queryIsReceivedRevisionFor.refetch();
  };

  return { loading, data, refetchAll };
}
