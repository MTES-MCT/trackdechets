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
