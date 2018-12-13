import gql from "graphql-tag";

const MARK_SEALED = gql`
  mutation MarkAsSealed($id: ID) {
    markAsSealed(id: $id) {
      id
      status
    }
  }
`;
const MARK_SENT = gql`
  mutation MarkAsSent($id: ID, $info: SentFormInput) {
    markAsSent(id: $id, sentInfo: $info) {
      id
      status
    }
  }
`;
const MARK_RECEIVED = gql`
  mutation MarkAsReceived($id: ID, $info: ReceivedFormInput) {
    markAsReceived(id: ID, receivedInfo: $info) {
      id
      status
    }
  }
`;
const MARK_PROCESSED = gql`
  mutation MarkAsProcessed($id: ID, $info: ProcessedFormInput) {
    markAsProcessed(id: ID, processedInfo: $info) {
      id
      status
    }
  }
`;

export default {
  SEALED: MARK_SEALED,
  SENT: MARK_SENT,
  RECEIVED: MARK_RECEIVED,
  PROCESSED: MARK_PROCESSED
};
