import { gql } from "@apollo/client";

export const CREATE_REGISTRY_DELEGATION = gql`
  mutation createRegistryDelegation($input: CreateRegistryDelegationInput!) {
    createRegistryDelegation(input: $input) {
      id
      updatedAt
      delegate {
        orgId
      }
      delegator {
        orgId
      }
      startDate
      endDate
      comment
      status
    }
  }
`;

export const REGISTRY_DELEGATIONS = gql`
  query registryDelegations(
    $skip: Int
    $first: Int
    $where: RegistryDelegationWhere
  ) {
    registryDelegations(skip: $skip, first: $first, where: $where) {
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
          updatedAt
          delegate {
            name
            givenName
            orgId
          }
          delegator {
            name
            givenName
            orgId
          }
          startDate
          endDate
          comment
          status
        }
      }
    }
  }
`;

export const REVOKE_REGISTRY_DELEGATION = gql`
  mutation revokeRegistryDelegation($delegationId: ID!) {
    revokeRegistryDelegation(delegationId: $delegationId) {
      id
      isRevoked
      status
    }
  }
`;