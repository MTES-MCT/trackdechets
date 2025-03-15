import { gql } from "@apollo/client";

const adminRequestFragment = gql`
  fragment AdminRequestFragment on AdminRequest {
    id
    company {
      orgId
      name
    }
    user {
      name
    }
    status
    createdAt
    validationMethod
  }
`;

export const CREATE_ADMIN_REQUEST = gql`
  mutation createAdminRequest($input: CreateAdminRequestInput!) {
    createAdminRequest(input: $input) {
      ...AdminRequestFragment
    }
  }

  ${adminRequestFragment}
`;

export const ADMIN_REQUESTS = gql`
  query adminRequests($skip: Int!, $first: Int!) {
    adminRequests(skip: $skip, first: $first) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          ...AdminRequestFragment
        }
      }
    }
  }

  ${adminRequestFragment}
`;

export const ADMIN_REQUESTS_ADMIN = gql`
  query adminRequestsAdmin($skip: Int!, $first: Int!) {
    adminRequestsAdmin(skip: $skip, first: $first) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          ...AdminRequestFragment
        }
      }
    }
  }

  ${adminRequestFragment}
`;

export const ADMIN_REQUEST = gql`
  query adminRequest($adminRequestId: ID!) {
    adminRequest(adminRequestId: $adminRequestId) {
      ...AdminRequestFragment
    }
  }

  ${adminRequestFragment}
`;

export const ACCEPT_ADMIN_REQUEST = gql`
  mutation acceptAdminRequest($input: AcceptAdminRequestInput!) {
    acceptAdminRequest(input: $input) {
      ...AdminRequestFragment
    }
  }

  ${adminRequestFragment}
`;

export const REFUSE_ADMIN_REQUEST = gql`
  mutation refuseAdminRequest($adminRequestId: ID!) {
    refuseAdminRequest(adminRequestId: $adminRequestId) {
      ...AdminRequestFragment
    }
  }

  ${adminRequestFragment}
`;
