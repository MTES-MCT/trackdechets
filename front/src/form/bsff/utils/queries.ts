import { gql } from "@apollo/client";
import {
  FullBsffFragment,
  PreviousBsffPackagingFragment
} from "../../../Apps/common/queries/fragments";

export const GET_BSFF_FORM = gql`
  query Bsff($id: ID!) {
    bsff(id: $id) {
      ...FullBsff
    }
  }
  ${FullBsffFragment}
`;

export const GET_PREVIOUS_PACKAGINGS = gql`
  query BsffPackagings($where: BsffPackagingWhere, $first: Int) {
    bsffPackagings(where: $where, first: $first) {
      totalCount
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          ...PreviousBsffPackaging
        }
      }
    }
  }
  ${PreviousBsffPackagingFragment}
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

export const UPDATE_BSFF_PACKAGING = gql`
  mutation UpdateBsffPackaging($id: ID!, $input: UpdateBsffPackagingInput!) {
    updateBsffPackaging(id: $id, input: $input) {
      id
    }
  }
`;

export const SIGN_BSFF = gql`
  mutation SignBsff($id: ID!, $input: BsffSignatureInput!) {
    signBsff(id: $id, input: $input) {
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
