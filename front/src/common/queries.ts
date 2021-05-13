import { gql } from "@apollo/client";
import {
  detailFormFragment,
  fullFormFragment,
  dasriFragment,
} from "./fragments";

// full fledged form to display in detailled views
export const GET_DETAIL_FORM = gql`
  query Form($id: ID) {
    form(id: $id) {
      ...DetailFormFragment
    }
  }
  ${detailFormFragment}
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
`;
