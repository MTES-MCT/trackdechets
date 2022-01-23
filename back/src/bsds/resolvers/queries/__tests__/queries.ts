import { fullBsdFragment } from "../../../fragments";
import { gql } from "apollo-server-express";

export const GET_BSDS = gql`
  ${fullBsdFragment}
  query GetBsds($where: BsdWhere) {
    bsds(where: $where) {
      edges {
        node {
          ...FullBsdFragment
        }
      }
    }
  }
`;
