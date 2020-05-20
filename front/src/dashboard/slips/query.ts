import gql from "graphql-tag";
import { fullFormFragment } from "../../common/fragments";

export const GET_SLIPS = gql`
  query GetSlips(
    $siret: String
    $status: [FormStatus]
    $hasNextStep: Boolean
    $first: Int = 50
    $skip: Int
  ) {
    forms(
      siret: $siret
      status: $status
      hasNextStep: $hasNextStep
      first: $first
      skip: $skip
    ) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;
