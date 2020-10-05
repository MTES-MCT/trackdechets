import gql from "graphql-tag";
import { fullFormFragment } from "src/common/fragments";
import { ITEMS_PER_PAGE } from "../constants";

export const GET_SLIPS = gql`
  query GetSlips(
    $siret: String
    $status: [FormStatus!]
    $hasNextStep: Boolean
    $first: Int = ${ITEMS_PER_PAGE}
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
