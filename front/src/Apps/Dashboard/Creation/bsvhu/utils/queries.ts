import { gql } from "@apollo/client";
import { FullBsvhuFragment } from "../../../../common/queries/fragments";

export const GET_VHU_FORM = gql`
  query Bsvhu($id: ID!) {
    bsvhu(id: $id) {
      ...FullBsvhu
      metadata {
        errors {
          message
          path
          requiredFor
        }
        fields {
          sealed
        }
      }
    }
  }
  ${FullBsvhuFragment}
`;

export const GET_VHU_FORMS = gql`
  query Bsvhus {
    bsvhus {
      totalCount
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          ...FullBsvhu
          metadata {
            errors {
              message
              path
              requiredFor
            }
          }
        }
      }
    }
  }
  ${FullBsvhuFragment}
`;

export const DUPLICATE_VHU_FORM = gql`
  mutation DuplicateBsvhu($id: ID!) {
    duplicateBsvhu(id: $id) {
      ...FullBsvhu
    }
  }
  ${FullBsvhuFragment}
`;

export const CREATE_DRAFT_VHU = gql`
  mutation CreateDraftVhu($input: BsvhuInput!) {
    createDraftBsvhu(input: $input) {
      id
    }
  }
`;

export const CREATE_BSVHU = gql`
  mutation CreateBsvhu($input: BsvhuInput!) {
    createBsvhu(input: $input) {
      id
    }
  }
`;

export const UPDATE_VHU_FORM = gql`
  mutation UpdateBsvhu($id: ID!, $input: BsvhuInput!) {
    updateBsvhu(id: $id, input: $input) {
      ...FullBsvhu
    }
  }
  ${FullBsvhuFragment}
`;

export const SIGN_VHU_FORM = gql`
  mutation SignBsvhu($id: ID!, $input: BsvhuSignatureInput!) {
    signBsvhu(id: $id, input: $input) {
      ...FullBsvhu
    }
  }
  ${FullBsvhuFragment}
`;

export const PDF_VHU_FORM = gql`
  query PdfBsvhu($id: ID) {
    bsvhuPdf(id: $id) {
      downloadLink
      token
    }
  }
`;
