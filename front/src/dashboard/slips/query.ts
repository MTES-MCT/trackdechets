import gql from "graphql-tag";

export const GET_SLIPS = gql`
  query GetSlips {
    forms {
      id
      createdAt
      emitter {
        company {
          name
        }
      }
      recipient {
        company {
          name
        }
      }
      wasteDetails {
        code
      }
    }
  }
`;
