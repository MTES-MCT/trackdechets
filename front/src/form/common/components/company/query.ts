import { gql } from "@apollo/client";

export const FAVORITES = gql`
  query Favorites($siret: String!, $type: FavoriteType!) {
    favorites(siret: $siret, type: $type) {
      orgId
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
      workerCertification {
        hasSubSectionFour
        hasSubSectionThree
        certificationNumber
        validityLimit
        organisation
      }
    }
  }
`;

/**
 * TODO Clean up query, barely used anymore
 */
export const COMPANY_INFOS = gql`
  query CompanyInfos($siret: String!, $clue: String) {
    companyInfos(siret: $siret, clue: $clue) {
      orgId
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
      contactPhone
      contactEmail
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
      brokerReceipt {
        receiptNumber
        validityLimit
        department
      }
      workerCertification {
        hasSubSectionFour
        hasSubSectionThree
        certificationNumber
        validityLimit
        organisation
      }
    }
  }
`;

export const SEARCH_COMPANIES = gql`
  query SearchCompanies($clue: String!, $department: String) {
    searchCompanies(clue: $clue, department: $department) {
      orgId
      siret
      vatNumber
      name
      address
      etatAdministratif
      codePaysEtrangerEtablissement
      isRegistered
      trackdechetsId
      contact
      contactPhone
      contactEmail
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
      brokerReceipt {
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
      workerCertification {
        hasSubSectionFour
        hasSubSectionThree
        certificationNumber
        validityLimit
        organisation
      }
    }
  }
`;

export const COMPANY_PRIVATE_INFOS = gql`
  query CompanyPrivateInfos($clue: String!) {
    companyPrivateInfos(clue: $clue) {
      orgId
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
      brokerReceipt {
        receiptNumber
        validityLimit
        department
      }
    }
  }
`;

export const COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS = gql`
  query CompanyPrivateInfos($clue: String!) {
    companyPrivateInfos(clue: $clue) {
      siret
      receivedSignatureAutomations {
        from {
          siret
        }
      }
    }
  }
`;

export const COMPANY_SELECTOR_PRIVATE_INFOS = gql`
  query CompanyPrivateInfos($clue: String!) {
    companyPrivateInfos(clue: $clue) {
      orgId
      siret
      vatNumber
      etatAdministratif
      statutDiffusionEtablissement
      isRegistered
      isAnonymousCompany
      companyTypes
      codePaysEtrangerEtablissement
    }
  }
`;
