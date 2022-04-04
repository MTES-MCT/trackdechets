import { gql } from "@apollo/client";

export const CREATE_ACCESS_TOKEN = gql`
  mutation CreateAccessToken($input: CreateAccessTokenInput!) {
    createAccessToken(input: $input) {
      id
      token
    }
  }
`;

export const ACCESS_TOKENS = gql`
  {
    accessTokens {
      id
      description
      lastUsed
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

export const REVOKE_ALL_ACCESS_TOKENS = gql`
  mutation RevokeAllAccessTokens {
    revokeAllAccessTokens {
      id
    }
  }
`;
