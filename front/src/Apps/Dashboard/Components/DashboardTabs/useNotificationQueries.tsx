import { gql, useQuery } from "@apollo/client";

const GET_ALL_NOTIFICATIONS = gql`
  query GetAllNotifications($orgId: [String!]) {
    action: bsds(where: { isForActionFor: $orgId }) {
      totalCount
    }
    transport: bsds(where: { isToCollectFor: $orgId }) {
      totalCount
    }
    emittedRevision: bsds(where: { isEmittedRevisionFor: $orgId }) {
      totalCount
    }
    receivedRevision: bsds(where: { isReceivedRevisionFor: $orgId }) {
      totalCount
    }
  }
`;

export function useNotificationQueries(orgId: string) {
  const { data, loading, refetch } = useQuery(GET_ALL_NOTIFICATIONS, {
    variables: { orgId: [orgId] }
  });

  return {
    loading,
    data: {
      actionCount: data?.action.totalCount ?? 0,
      transportCount: data?.transport.totalCount ?? 0,
      isEmittedRevisionForCount: data?.emittedRevision.totalCount ?? 0,
      isReceivedRevisionForCount: data?.receivedRevision.totalCount ?? 0
    },
    refetchAll: refetch
  };
}
