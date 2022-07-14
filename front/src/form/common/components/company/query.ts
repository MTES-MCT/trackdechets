import { gql } from "@apollo/client";

export const FAVORITES = gql`
  query Favorites($siret: String!, $type: FavoriteType!) {
    favorites(siret: $siret, type: $type) {
      siret
      vatNumber
      name
      address
      contact
      phone
      mail
      isRegistered
      codePaysEtrangerEtablissement
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
      brokerReceipt {
        receiptNumber
        validityLimit
        department
      }
      vhuAgrementDemolisseur {
        agrementNumber
      }
      vhuAgrementBroyeur {
        agrementNumber
      }
    }
  }
`;

export const COMPANY_INFOS = gql`
  query CompanyInfos($siret: String!, $clue: String) {
    companyInfos(siret: $siret, clue: $clue) {
      siret
      vatNumber
      name
      naf
      libelleNaf
      address
      etatAdministratif
      statutDiffusionEtablissement
      isRegistered
      companyTypes
      codePaysEtrangerEtablissement
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
      etatAdministratif
      codePaysEtrangerEtablissement
      isRegistered
      contact
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
      vhuAgrementDemolisseur {
        agrementNumber
        department
      }
      vhuAgrementBroyeur {
        agrementNumber
        department
      }
    }
  }
`;

export const COMPANY_PRIVATE_INFOS = gql`
  query CompanyPrivateInfos($clue: String!) {
    companyPrivateInfos(clue: $clue) {
      siret
      vatNumber
      name
      naf
      libelleNaf
      address
      etatAdministratif
      statutDiffusionEtablissement
      isRegistered
      isAnonymousCompany
      companyTypes
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

export const COMPANY_SELECTOR_PRIVATE_INFOS = gql`
  query CompanyPrivateInfos($clue: String!) {
    companyPrivateInfos(clue: $clue) {
      siret
      vatNumber
      name
      naf
      libelleNaf
      address
      etatAdministratif
      statutDiffusionEtablissement
      isRegistered
      isAnonymousCompany
      companyTypes
    }
  }
`;
