import { gql } from "@apollo/client";
import { fullBspaohFragment } from "../fragments";

export const UPDATE_BSPAOH = gql`
  mutation UpdateBspaoh($id: ID!, $input: BspaohInput!) {
    updateBspaoh(id: $id, input: $input) {
      ...FullBspaoh
    }
  }
  ${fullBspaohFragment}
`;
