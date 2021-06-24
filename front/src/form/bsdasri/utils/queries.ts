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
  mutation CreateDraftBsdasri($input: BsdasriCreateInput!) {
    createDraftBsdasri(input: $input) {
      id
    }
  }
`;

export const UPDATE_BSDASRI = gql`
  mutation UpdateBsdasri($input: BsdasriUpdateInput!, $id: ID!) {
    updateBsdasri(input: $input, id: $id) {
      id
    }
  }
`;
