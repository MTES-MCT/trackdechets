import gql from "graphql-tag";

export const GET_SLIPS = gql`
  query GetSlips {
    forms {
      id
      createdAt
      status
      emitter {
        company {
          name
          siret
        }
      }
      recipient {
        company {
          name
          siret
        }
      }
      wasteDetails {
        code
      }
    }
  }
`;
