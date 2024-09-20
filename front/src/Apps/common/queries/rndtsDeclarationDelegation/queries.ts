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
    $after: ID
    $first: Int
    $where: RndtsDeclarationDelegationWhere
  ) {
    rndtsDeclarationDelegations(after: $after, first: $first, where: $where) {
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
