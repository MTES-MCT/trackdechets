import gql from "graphql-tag";
import { fullFormFragment } from "common/fragments";
import { ITEMS_PER_PAGE } from "../constants";

export const GET_SLIPS = gql`
  query GetSlips(
    $siret: String
    $status: [FormStatus!]
    $hasNextStep: Boolean
    $cursorAfter: ID
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
