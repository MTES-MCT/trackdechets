import gql from "graphql-tag";
import { fullFormFragment } from "../../common/fragments";

export const GET_SLIPS = gql`
  query GetSlips($siret: String, $status: [FormStatus], $hasNextStep: Boolean) {
    forms(siret: $siret, status: $status, hasNextStep: $hasNextStep) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;
