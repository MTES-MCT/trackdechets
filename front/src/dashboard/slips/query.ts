import gql from "graphql-tag";

export const GET_SLIPS = gql`
  query GetSlips {
    forms {
      id
      readableId
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
        quantity
      }
    }
  }
`;
