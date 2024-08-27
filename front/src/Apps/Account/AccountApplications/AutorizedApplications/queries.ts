import { gql } from "@apollo/client";

export const AUTHORIZED_APPLICATIONS = gql`
  query AuthorizedApplications {
    authorizedApplications {
      id
      name
      logoUrl
      lastConnection
      admin
    }
  }
`;

export const REVOKE_AUTHORIZED_APPLICATION = gql`
  mutation RevokeAuthorizedApplication($id: ID!) {
    revokeAuthorizedApplication(id: $id) {
      id
    }
  }
`;
