import gql from "graphql-tag";

export const GET_ME_AND_COMPANIES = gql`
  query MeAndCompanies {
    me {
      company {
        siret
        name
        address
      }
    }
  }
`;
