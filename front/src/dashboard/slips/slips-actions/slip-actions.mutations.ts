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
  mutation MarkAsSent($id: ID, $info: SentFormInput!) {
    markAsSent(id: $id, sentInfo: $info) {
      id
      status
    }
  }
`;
const MARK_RECEIVED = gql`
  mutation MarkAsReceived($id: ID, $info: ReceivedFormInput!) {
    markAsReceived(id: $id, receivedInfo: $info) {
      id
      status
    }
  }
`;
const MARK_PROCESSED = gql`
  mutation MarkAsProcessed($id: ID, $info: ProcessedFormInput!) {
    markAsProcessed(id: $id, processedInfo: $info) {
      id
      status
    }
  }
`;

const DUPLICATE_FORM = gql`
  mutation DuplicateForm($id: ID!) {
    duplicateForm(id: $id) {
      id
      readableId
      createdAt
      status
      emitter {
        company {
          name
          siret
        }
      }
      recipient {
        company {
          name
          siret
        }
        processingOperation
      }
      wasteDetails {
        code
        name
        quantity
      }
    }
  }
`;

const DELETE_FORM = gql`
  mutation DeleteForm($id: ID!) {
    deleteForm(id: $id) {
      id
    }
  }
`;

export default {
  SEALED: MARK_SEALED,
  SENT: MARK_SENT,
  RECEIVED: MARK_RECEIVED,
  PROCESSED: MARK_PROCESSED,
  DUPLICATE_FORM,
  DELETE_FORM
};
