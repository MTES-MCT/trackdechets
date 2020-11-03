import gql from "graphql-tag";
import {
  fullFormFragment,
  statusChangeFragment,
} from "common/fragments";

const MARK_SEALED = gql`
  mutation MarkAsSealed($id: ID!) {
    markAsSealed(id: $id) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;
const MARK_SENT = gql`
  mutation MarkAsSent($id: ID!, $info: SentFormInput!) {
    markAsSent(id: $id, sentInfo: $info) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;
const MARK_RECEIVED = gql`
  mutation MarkAsReceived($id: ID!, $info: ReceivedFormInput!) {
    markAsReceived(id: $id, receivedInfo: $info) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;
const MARK_PROCESSED = gql`
  mutation MarkAsProcessed($id: ID!, $info: ProcessedFormInput!) {
    markAsProcessed(id: $id, processedInfo: $info) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

const MARK_TEMP_STORED = gql`
  mutation MarkAsTempStored($id: ID!, $info: TempStoredFormInput!) {
    markAsTempStored(id: $id, tempStoredInfos: $info) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

const MARK_RESEALED = gql`
  mutation MarkAsResealed($id: ID!, $info: ResealedFormInput!) {
    markAsResealed(id: $id, resealedInfos: $info) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

const MARK_RESENT = gql`
  mutation MarkAsResent($id: ID!, $info: ResentFormInput!) {
    markAsResent(id: $id, resentInfos: $info) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

const DUPLICATE_FORM = gql`
  mutation DuplicateForm($id: ID!) {
    duplicateForm(id: $id) {
      ...FullForm
    }
  }
  ${fullFormFragment}
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
  TEMP_STORED: MARK_TEMP_STORED,
  RESEALED: MARK_RESEALED,
  RESENT: MARK_RESENT,
  DUPLICATE_FORM,
  DELETE_FORM,
};
