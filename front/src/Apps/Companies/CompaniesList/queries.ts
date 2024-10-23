import { DocumentNode } from "@apollo/client";
import gql from "graphql-tag";

export const MY_COMPANIES = (fragment: DocumentNode) => gql`
  query MyCompanies($first: Int, $after: ID, $search: String) {
    myCompanies(first: $first, after: $after, search: $search) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          ...CompanyPrivateFragment
        }
      }
    }
  }
  ${fragment}
`;
