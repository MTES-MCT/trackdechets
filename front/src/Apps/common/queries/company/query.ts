import { gql } from "@apollo/client";
import { FavoriteType } from "@td/codegen-ui";

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
wasteVehiclesTypes`;

const commonCompanyTypesSearchString = `
collectorTypes
wasteProcessorTypes`;

const transporterReceiptCompanySearchString = `
transporterReceipt {
  receiptNumber
  validityLimit
  department
}`;

const traderReceiptCompanySearchString = `
traderReceipt {
  receiptNumber
  validityLimit
  department
}`;

const brokerReceiptCompanySearchString = `
brokerReceipt {
  receiptNumber
  validityLimit
  department
}`;

const vhuAgrementDemolisseurCompanySearchString = `
vhuAgrementDemolisseur {
  agrementNumber
  department
}`;

const vhuAgrementBroyeurCompanySearchString = `
vhuAgrementBroyeur {
  agrementNumber
  department
}`;

const workerCertificationCompanySearchString = `
workerCertification {
  hasSubSectionFour
  hasSubSectionThree
  certificationNumber
  validityLimit
  organisation
}`;

const companyAddressSearchString = `
addressVoie
addressPostalCode
addressCity
`;

const companyStatusDiffusionSearchString = `
statutDiffusionEtablissement
`;

const companySearchResultFragment = gql`
  fragment CompanySearchResultFragment on CompanySearchResult {
    ${commonCompanySearchString}
    ${companyAddressSearchString}
    ${commonCompanyTypesSearchString}
    ${transporterReceiptCompanySearchString}
    ${traderReceiptCompanySearchString}
    ${brokerReceiptCompanySearchString}
    ${vhuAgrementDemolisseurCompanySearchString}
    ${vhuAgrementBroyeurCompanySearchString}
    ${workerCertificationCompanySearchString}
    ${companyStatusDiffusionSearchString}
  }
`;
const companySearchPrivateFragment = gql`
  fragment CompanySearchPrivateFragment on CompanySearchPrivate {
    ${commonCompanySearchString}
    ${transporterReceiptCompanySearchString}
    ${traderReceiptCompanySearchString}
    ${brokerReceiptCompanySearchString}
    ${vhuAgrementDemolisseurCompanySearchString}
    ${vhuAgrementBroyeurCompanySearchString}
    ${workerCertificationCompanySearchString}
  }
`;

export const SEARCH_COMPANIES = gql`
  query SearchCompanies(
    $clue: String!
    $department: String
    $allowForeignCompanies: Boolean
    $allowClosedCompanies: Boolean
  ) {
    searchCompanies(
      clue: $clue
      department: $department
      allowForeignCompanies: $allowForeignCompanies
      allowClosedCompanies: $allowClosedCompanies
    ) {
      ...CompanySearchResultFragment
    }
  }
  ${companySearchResultFragment}
`;

/**
 * Only query the necessary parts
 */
export const FAVORITES = (favType: FavoriteType) => {
  let favFragmentString = commonCompanySearchString;
  switch (favType) {
    case FavoriteType.Broker:
      favFragmentString = favFragmentString.concat(
        brokerReceiptCompanySearchString
      );
      break;
    case FavoriteType.Worker:
      favFragmentString = favFragmentString.concat(
        workerCertificationCompanySearchString
      );
      break;
    case FavoriteType.Trader:
      favFragmentString = favFragmentString.concat(
        traderReceiptCompanySearchString
      );
      break;
    case FavoriteType.Emitter:
    case FavoriteType.Destination:
    case FavoriteType.Recipient:
    case FavoriteType.NextDestination:
    case FavoriteType.TemporaryStorageDetail:
      favFragmentString = favFragmentString.concat(
        vhuAgrementDemolisseurCompanySearchString,
        vhuAgrementBroyeurCompanySearchString
      );
      break;
    case FavoriteType.Transporter:
      favFragmentString = favFragmentString.concat(
        transporterReceiptCompanySearchString
      );
      break;
  }
  const favoritesFragment = gql`
    fragment FavoritesFragment on CompanySearchResult {
      ${favFragmentString}
    }
  `;
  return gql`
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
        ...FavoritesFragment
      }
    }
    ${favoritesFragment}
  `;
};

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
      companyTypes
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
