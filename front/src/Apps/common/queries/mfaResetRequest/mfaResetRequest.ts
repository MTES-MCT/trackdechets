import { gql } from "@apollo/client";

const mfaResetRequestFragment = gql`
  fragment MfaResetRequestFragment on MfaResetRequest {
    id
    status
    note
    createdAt
    dueAt
    updatedAt
    user {
      email
      name
    }
  }
`;

export const MFA_RESET_REQUESTS_ADMIN = gql`
  query mfaResetRequestsAdmin($skip: Int, $first: Int) {
    mfaResetRequestsAdmin(skip: $skip, first: $first) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          ...MfaResetRequestFragment
        }
      }
    }
  }
  ${mfaResetRequestFragment}
`;

export const MFA_RESET_REQUEST_SUMMARY = gql`
  query mfaResetRequestSummary($email: String!) {
    mfaResetRequestSummary(email: $email) {
      user {
        id
        email
        name
      }
      hasMfa
      hasPendingRequest
      companiesCount
      adminNotifiedCount
      noAdminWarning
    }
  }
`;

export const CREATE_MFA_RESET_REQUEST = gql`
  mutation createMfaResetRequest($input: CreateMfaResetRequestInput!) {
    createMfaResetRequest(input: $input) {
      ...MfaResetRequestFragment
    }
  }
  ${mfaResetRequestFragment}
`;

export const CANCEL_MFA_RESET_REQUEST = gql`
  mutation cancelMfaResetRequest($mfaResetRequestId: ID!) {
    cancelMfaResetRequest(mfaResetRequestId: $mfaResetRequestId) {
      ...MfaResetRequestFragment
    }
  }
  ${mfaResetRequestFragment}
`;
