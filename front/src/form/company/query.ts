import gql from "graphql-tag";

export const FAVORITES = gql`
  query Favorites($type: FavoriteType!) {
    favorites(type: $type) {
      siret
      name
      address
      contact
      phone
      mail
    }
  }
`;

export const COMPANY_INFOS = gql`
  query CompanyInfos($siret: String!) {
    companyInfos(siret: $siret) {
      siret
      name
      address
    }
  }
`;

export const SEARCH_COMPANIES = gql`
  query SearchCompanies($clue: String!, $department: Int) {
    searchCompanies(clue: $clue, department: $department) {
      siret
      name
      address
    }
  }
`;
