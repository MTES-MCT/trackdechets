import gql from "graphql-tag";
import { fullFormFragment } from "../../common/fragments";

export const GET_SLIPS = gql`
  query GetSlips($siret: String) {
    forms(siret: $siret) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;
