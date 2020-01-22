import gql from "graphql-tag";

export const GET_SLIPS = gql`
  query GetSlips($siret: String) {
    forms(siret: $siret) {
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
        processingOperation
      }
      wasteDetails {
        code
        name
        quantity
      }
      quantityReceived
    }
  }
`;
