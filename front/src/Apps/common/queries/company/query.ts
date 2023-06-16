import { gql } from "@apollo/client";

export const FAVORITES = gql`
  query Favorites(
    $orgId: String!
    $type: FavoriteType!
    $allowForeignCompanies: Boolean
  ) {
    favorites(
      orgId: $orgId
      type: $type
      allowForeignCompanies: $allowForeignCompanies
    ) {
      orgId
      siret
      vatNumber
      name
      address
      contact
      contactPhone
      contactEmail
      isRegistered
      companyTypes
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

const commonCompanySearchString = `
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
companyTypes
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
}`;

const companySearchResultFragment = gql`
  fragment CompanySearchResultFragment on CompanySearchResult {
    ${commonCompanySearchString}
  }
`;

const companySearchPrivateFragment = gql`
  fragment CompanySearchPrivateFragment on CompanySearchPrivate {
    ${commonCompanySearchString}
  }
`;

export const SEARCH_COMPANIES = gql`
  query SearchCompanies($clue: String!, $department: String) {
    searchCompanies(clue: $clue, department: $department) {
      ...CompanySearchResultFragment
    }
  }
  ${companySearchResultFragment}
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
      ...CompanySearchPrivateFragment
    }
  }
  ${companySearchPrivateFragment}
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
