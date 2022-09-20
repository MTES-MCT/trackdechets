import { gql } from "@apollo/client";
import { FullBsffFragment } from "common/fragments";

export const GET_BSFF_FORM = gql`
  query Bsff($id: ID!) {
    bsff(id: $id) {
      ...FullBsff
    }
  }
  ${FullBsffFragment}
`;

export const GET_BSFF_FORMS = gql`
  query Bsffs($where: BsffWhere) {
    bsffs(where: $where) {
      totalCount
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          ...FullBsff
        }
      }
    }
  }
  ${FullBsffFragment}
`;

export const CREATE_DRAFT_BSFF = gql`
  mutation CreateDraftBsff($input: BsffInput!) {
    createDraftBsff(input: $input) {
      ...FullBsff
    }
  }
  ${FullBsffFragment}
`;

export const UPDATE_BSFF_FORM = gql`
  mutation UpdateBsff($id: ID!, $input: BsffInput!) {
    updateBsff(id: $id, input: $input) {
      ...FullBsff
    }
  }
  ${FullBsffFragment}
`;

export const SIGN_BSFF = gql`
  mutation SignBsff(
    $id: ID!
    $type: BsffSignatureType!
    $signature: SignatureInput!
  ) {
    signBsff(id: $id, type: $type, signature: $signature) {
      ...FullBsff
    }
  }
  ${FullBsffFragment}
`;

export const PDF_BSFF_FORM = gql`
  query PdfBsff($id: ID!) {
    bsffPdf(id: $id) {
      downloadLink
      token
    }
  }
`;
