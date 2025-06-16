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

  const queryRevision = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(
    NOTIFICATION_QUERY,
    { variables: { where: { isInRevisionFor: [orgId] } } }
  );

  const queryTransport = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(
    NOTIFICATION_QUERY,
    { variables: { where: { isToCollectFor: [orgId] } } }
  );

  const loading =
    queryAction.loading || queryRevision.loading || queryTransport.loading;

  const data = useMemo(
    () => ({
      actionCount: queryAction.data?.bsds.totalCount ?? 0,
      revisionCount: queryRevision.data?.bsds.totalCount ?? 0,
      transportCount: queryTransport.data?.bsds.totalCount ?? 0
    }),
    [
      queryAction.data?.bsds.totalCount,
      queryRevision.data?.bsds.totalCount,
      queryTransport.data?.bsds.totalCount
    ]
  );

  const refetchAll = () => {
    queryAction.refetch();
    queryRevision.refetch();
    queryTransport.refetch();
  };

  return { loading, data, refetchAll };
}
