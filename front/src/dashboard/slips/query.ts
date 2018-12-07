import gql from "graphql-tag";

export const GET_SLIPS = gql`
  query GetSlips {
    forms {
      id
      createdAt
    }
  }
`;
