import { gql } from "@apollo/client";

export const CREATE_RNDTS_DECLARATION_DELEGATION = gql`
  mutation createRndtsDeclarationDelegation(
    $input: CreateRndtsDeclarationDelegationInput!
  ) {
    createRndtsDeclarationDelegation(input: $input) {
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

export const RNDTS_DECLARATION_DELEGATIONS = gql`
  query rndtsDeclarationDelegations(
    $skip: Int
    $first: Int
    $where: RndtsDeclarationDelegationWhere
  ) {
    rndtsDeclarationDelegations(skip: $skip, first: $first, where: $where) {
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
            orgId
          }
          delegator {
            name
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

export const REVOKE_RNDTS_DECLARATION_DELEGATION = gql`
  mutation revokeRndtsDeclarationDelegation($delegationId: ID!) {
    revokeRndtsDeclarationDelegation(delegationId: $delegationId) {
      id
      isRevoked
      status
    }
  }
`;
