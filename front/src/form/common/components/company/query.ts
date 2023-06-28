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

export const COMPANY_INFOS_REGISTERED_VALIDATION_SCHEMA = gql`
  query CompanyInfos($siret: String!) {
    companyInfos(siret: $siret) {
      orgId
      siret
      vatNumber
      name
      isRegistered
      companyTypes
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

/**
 * Used for Account company validation
 */
export const COMPANY_ACCOUNT_ADD_PRIVATE_INFOS = gql`
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
      name
      address
      vatNumber
      etatAdministratif
      statutDiffusionEtablissement
      isRegistered
      isAnonymousCompany
      companyTypes
      codePaysEtrangerEtablissement
      transporterReceipt {
        receiptNumber
        validityLimit
        department
      }
    }
  }
`;

export const TRANSPORTER_RECEIPT = gql`
  query CompanyPrivateInfos($clue: String!) {
    companyPrivateInfos(clue: $clue) {
      transporterReceipt {
        receiptNumber
        validityLimit
        department
      }
    }
  }
`;
