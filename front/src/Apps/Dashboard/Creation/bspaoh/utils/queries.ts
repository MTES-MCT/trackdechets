import { gql } from "@apollo/client";

import { fullBspaohFragment } from "../../../../common/queries/fragments";

export const GET_BSPAOH = gql`
  query Bspaoh($id: ID!) {
    bspaoh(id: $id) {
      ...BspaohFragment
    }
  }
  ${fullBspaohFragment}
`;

export const CREATE_DRAFT_BSPAOH = gql`
  mutation CreateDraftBspaoh($input: BspaohInput!) {
    createDraftBspaoh(input: $input) {
      id
    }
  }
`;

export const CREATE_BSPAOH = gql`
  mutation CreateBspaoh($input: BspaohInput!) {
    createBspaoh(input: $input) {
      id
    }
  }
`;

export const UPDATE_BSPAOH = gql`
  mutation UpdateBspaoh($input: BspaohInput!, $id: ID!) {
    updateBspaoh(input: $input, id: $id) {
      id
    }
  }
`;

export const SIGN_BSPAOH = gql`
  mutation SignBspaoh($id: ID!, $input: BspaohSignatureInput!) {
    signBspaoh(id: $id, input: $input) {
      id
      status
    }
  }
`;
