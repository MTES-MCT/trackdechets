import { gql } from "@apollo/client";
import { FullBsdaFragment } from "Apps/common/queries/fragments";

export const GET_BSDA = gql`
  query Bsda($id: ID!) {
    bsda(id: $id) {
      ...FullBsda
    }
  }
  ${FullBsdaFragment}
`;

export const GET_BSDAS = gql`
  query Bsdas($first: Int, $after: ID, $where: BsdaWhere) {
    bsdas(first: $first, after: $after, where: $where) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          ...FullBsda
        }
      }
    }
  }
  ${FullBsdaFragment}
`;

export const DUPLICATE_BSDA = gql`
  mutation DuplicateBsda($id: ID!) {
    duplicateBsda(id: $id) {
      ...FullBsda
    }
  }
  ${FullBsdaFragment}
`;

export const CREATE_BSDA = gql`
  mutation CreateDraftBsda($input: BsdaInput!) {
    createDraftBsda(input: $input) {
      ...FullBsda
    }
  }
  ${FullBsdaFragment}
`;

export const UPDATE_BSDA = gql`
  mutation UpdateBsda($id: ID!, $input: BsdaInput!) {
    updateBsda(id: $id, input: $input) {
      ...FullBsda
    }
  }
  ${FullBsdaFragment}
`;

export const SIGN_BSDA = gql`
  mutation SignBsda($id: ID!, $input: BsdaSignatureInput!) {
    signBsda(id: $id, input: $input) {
      ...FullBsda
    }
  }
  ${FullBsdaFragment}
`;

export const GET_BSDA_PDF = gql`
  query PdfBsda($id: ID) {
    bsdaPdf(id: $id) {
      downloadLink
      token
    }
  }
`;
