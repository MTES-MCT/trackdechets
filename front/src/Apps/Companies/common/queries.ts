import { gql } from "@apollo/client";
import { AccountCompanyfragment } from "./fragments";

export const UPDATE_CONTACT_INFOS = gql`
  mutation UpdateCompany(
    $id: String!
    $contact: String
    $contactEmail: String
    $contactPhone: String
    $website: String
  ) {
    updateCompany(
      id: $id
      contact: $contact
      contactEmail: $contactEmail
      contactPhone: $contactPhone
      website: $website
    ) {
      id
      contact
      contactEmail
      contactPhone
      website
      userRole
    }
  }
`;

export const DELETE_COMPANY = gql`
  mutation DeleteCompany($id: ID!) {
    deleteCompany(id: $id) {
      id
    }
  }
`;

export const MY_COMPANIES = gql`
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
          ...AccountCompanyFragment
        }
      }
    }
  }
  ${AccountCompanyfragment.company}
`;
