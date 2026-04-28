import { gql } from "@apollo/client";
import {
  FicheInterventionFragment,
  FullBsffFragment,
  PreviousBsffPackagingFragment
} from "../fragments";

export const GET_BSFF_FORM = gql`
  query Bsff($id: ID!) {
    bsff(id: $id) {
      ...FullBsff
    }
  }
  ${FullBsffFragment}
`;

export const GET_PREVIOUS_PACKAGINGS = gql`
  query BsffPackagings($where: BsffPackagingWhere, $first: Int, $after: ID) {
    bsffPackagings(where: $where, first: $first, after: $after) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
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

export const PUBLISH_BSFF = gql`
  mutation PublishBsff($id: ID!) {
    publishBsff(id: $id) {
      id
      isDraft
    }
  }
`;

export const CREATE_BSFF = gql`
  mutation CreateBsff($input: BsffInput!) {
    createBsff(input: $input) {
      ...FullBsff
    }
  }
  ${FullBsffFragment}
`;

export const CREATE_BSFF_FICHE_INTERVENTION = gql`
  mutation CreateBsffFicheIntervention($input: BsffFicheInterventionInput!) {
    createFicheInterventionBsff(input: $input) {
      ...FicheInterventionFragment
    }
  }
  ${FicheInterventionFragment}
`;
