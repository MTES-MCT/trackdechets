import { gql } from "@apollo/client";

import { dasriFragment } from "common/fragments";

export const GET_BSDASRI = gql`
  query Bsdasri($id: ID!) {
    bsdasri(id: $id) {
      ...DasriFragment
    }
  }
  ${dasriFragment}
`;

export const CREATE_BSDASRI = gql`
  mutation CreateDraftBsdasri($input: BsdasriInput!) {
    createDraftBsdasri(input: $input) {
      id
    }
  }
`;

export const UPDATE_BSDASRI = gql`
  mutation UpdateBsdasri($input: BsdasriInput!, $id: ID!) {
    updateBsdasri(input: $input, id: $id) {
      id
    }
  }
`;

export const SIGN_BSDASRI = gql`
  mutation SignBsdasri($id: ID!, $input: BsdasriSignatureInput!) {
    signBsdasri(id: $id, input: $input) {
      id
      status
    }
  }
`;
export const SIGN_BSDASRI_EMISSION_WITH_SECRET_CODE = gql`
  mutation SignBsdasriEmissionWithSecretCode(
    $id: ID!
    $input: BsdasriSignatureWithSecretCodeInput!
  ) {
    signBsdasriEmissionWithSecretCode(id: $id, input: $input) {
      id
      status
    }
  }
`;
