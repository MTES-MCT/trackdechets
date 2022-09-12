import { gql } from "@apollo/client";
import {
  dashboardDasriFragment,
  dashboardVhuFragment,
  dashboardBsdaFragment,
  dashboardBsffFragment,
  dashboardFormFragment,
} from "../fragments";

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
            ...DashboardFormFragment
          }
          ... on Bsdasri {
            ...DashboardDasriFragment
          }
          ... on Bsvhu {
            ...DashboardVhuFragment
          }
          ... on Bsff {
            ...DashboardBsffFragment
          }
          ... on Bsda {
            ...DashboardBsdaFragment
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
  ${dashboardFormFragment}
  ${dashboardDasriFragment}
  ${dashboardBsffFragment}
  ${dashboardVhuFragment}
  ${dashboardBsdaFragment}
`;
