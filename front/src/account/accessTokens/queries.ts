import { gql } from "@apollo/client";

export const ACCESS_TOKENS = gql`
  {
    accessTokens {
      id
      description
      lastUsed
      tokenPreview
    }
  }
`;

export const REVOKE_ACCESS_TOKEN = gql`
  mutation RevokeAccessToken($id: ID!) {
    revokeAccessToken(id: $id) {
      id
    }
  }
`;
