import { gql } from "@apollo/client";

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
