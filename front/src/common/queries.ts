import { gql } from "@apollo/client";
import {
  detailFormFragment,
  fullFormFragment,
  dasriFragment,
  vhuFragment,
  bsdaFragment,
} from "./fragments";

// full fledged bsd to display in detailled views
export const GET_DETAIL_FORM = gql`
  query Form($id: ID) {
    form(id: $id) {
      ...DetailFormFragment
    }
  }
  ${detailFormFragment}
`;

export const GET_DETAIL_DASRI = gql`
  query Bsdasri($id: ID!) {
    bsdasri(id: $id) {
      ...DasriFragment
    }
  }
  ${dasriFragment}
`;

export const GET_DASRI_METADATA = gql`
  query Bsdasri($id: ID!) {
    bsdasri(id: $id) {
      metadata {
        errors {
          message
          requiredFor
        }
      }
    }
  }
`;

export const GET_BSDS = gql`
  query GetBsds(
    $after: String
    $first: Int
    $clue: String
    $where: BsdWhere
    $orderBy: OrderBy
  ) {
    bsds(
      after: $after
      first: $first
      clue: $clue
      where: $where
      orderBy: $orderBy
    ) {
      edges {
        node {
          ... on Form {
            ...FullForm
          }
          ... on Bsdasri {
            ...DasriFragment
          }
          ... on Bsvhu {
            ...VhuFragment
          }
          ... on Bsff {
            id
            bsffStatus: status
            bsffEmitter: emitter {
              company {
                name
              }
            }
            bsffDestination: destination {
              company {
                name
              }
            }
            waste {
              code
              nature
            }
          }
          ... on Bsda {
            ...BsdaFragment
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${fullFormFragment}
  ${dasriFragment}
  ${vhuFragment}
  ${bsdaFragment}
`;
