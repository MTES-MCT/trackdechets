import { gql } from "@apollo/client";

export const CREATE_ADMIN_REQUEST = gql`
  mutation createAdminRequest($input: CreateAdminRequestInput!) {
    createAdminRequest(input: $input) {
      id
      company {
        orgId
        name
      }
      status
      createdAt
    }
  }
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
          id
          company {
            orgId
            name
          }
          status
          createdAt
        }
      }
    }
  }
`;

export const ADMIN_REQUEST = gql`
  query adminRequests($adminRequestId: ID!) {
    adminRequest(adminRequestId: $adminRequestId) {
      id
      user {
        name
      }
      company {
        orgId
        name
      }
      status
      createdAt
    }
  }
`;

export const ACCEPT_ADMIN_REQUEST = gql`
  mutation acceptAdminRequest($input: AcceptAdminRequestInput!) {
    acceptAdminRequest(input: $input) {
      id
      company {
        orgId
        name
      }
      status
      createdAt
    }
  }
`;

export const REFUSE_ADMIN_REQUEST = gql`
  mutation refuseAdminRequest($adminRequestId: ID!) {
    refuseAdminRequest(adminRequestId: $adminRequestId) {
      id
      company {
        orgId
        name
      }
      status
      createdAt
    }
  }
`;
