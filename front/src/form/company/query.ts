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
      transporterReceipt {
        receiptNumber
        validityLimit
        department
      }
      traderReceipt {
        receiptNumber
        validityLimit
        department
      }
    }
  }
`;

export const COMPANY_INFOS = gql`
  query SignupCompanyInfos($siret: String!) {
    companyInfos(siret: $siret) {
      siret
      name
      naf
      address
      etatAdministratif
      isRegistered
      installation {
        codeS3ic
        urlFiche
        rubriques {
          rubrique
          category
        }
      }
      transporterReceipt {
        receiptNumber
        validityLimit
        department
      }
      traderReceipt {
        receiptNumber
        validityLimit
        department
      }
    }
  }
`;

export const SEARCH_COMPANIES = gql`
  query SearchCompanies($clue: String!, $department: String) {
    searchCompanies(clue: $clue, department: $department) {
      siret
      name
      address
      installation {
        codeS3ic
        urlFiche
      }
      transporterReceipt {
        receiptNumber
        validityLimit
        department
      }
      traderReceipt {
        receiptNumber
        validityLimit
        department
      }
    }
  }
`;
