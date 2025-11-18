import { gql } from "@apollo/client";

const AccountFieldCompanyTypesFragment = {
  company: gql`
    fragment AccountFieldCompanyTypesFragment on CompanyPrivate {
      id
      siret
      companyTypes
      collectorTypes
      wasteProcessorTypes
      wasteVehiclesTypes
      userRole
      workerCertification {
        id
        hasSubSectionFour
        hasSubSectionThree
        certificationNumber
        validityLimit
        organisation
      }
    }
  `
};

const AccountFieldCompanyGerepIdFragment = {
  company: gql`
    fragment AccountFieldCompanyGerepIdFragment on CompanyPrivate {
      id
      gerepId
      userRole
    }
  `
};

const AccountFieldCompanyGivenNameFragment = {
  company: gql`
    fragment AccountFieldCompanyGivenNameFragment on CompanyPrivate {
      id
      givenName
      userRole
    }
  `
};

const AccountFieldCompanyTransporterReceiptFragment = {
  company: gql`
    fragment AccountFieldCompanyTransporterReceiptFragment on CompanyPrivate {
      id
      siret
      userRole
      transporterReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
    }
  `
};

const AccountFieldCompanyTraderReceiptFragment = {
  company: gql`
    fragment AccountFieldCompanyTraderReceiptFragment on CompanyPrivate {
      id
      siret
      userRole
      traderReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
    }
  `
};

const AccountFieldCompanyBrokerReceiptFragment = {
  company: gql`
    fragment AccountFieldCompanyBrokerReceiptFragment on CompanyPrivate {
      id
      siret
      userRole
      brokerReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
    }
  `
};

const AccountFieldCompanyVerificationStatusFragment = {
  company: gql`
    fragment AccountFieldCompanyVerificationStatusFragment on CompanyPrivate {
      id
      orgId
      verificationStatus
    }
  `
};

const AccountFieldCompanyVhuAgrementBroyeurFragment = {
  company: gql`
    fragment AccountFieldCompanyVhuAgrementBroyeurFragment on CompanyPrivate {
      id
      siret
      userRole
      vhuAgrementBroyeur {
        id
        agrementNumber
        department
      }
    }
  `
};

const AccountFieldCompanyVhuAgrementDemolisseurFragment = {
  company: gql`
    fragment AccountFieldCompanyVhuAgrementDemolisseurFragment on CompanyPrivate {
      id
      siret
      userRole
      vhuAgrementDemolisseur {
        id
        agrementNumber
        department
      }
    }
  `
};

const AccountFieldCompanyWorkerCertificationFragment = {
  company: gql`
    fragment AccountFieldCompanyWorkerCertificationFragment on CompanyPrivate {
      id
      siret
      userRole
      workerCertification {
        id
        hasSubSectionFour
        hasSubSectionThree
        certificationNumber
        validityLimit
        organisation
      }
    }
  `
};

export const AccountCompanyInfoFragment = {
  company: gql`
    fragment AccountCompanyInfoFragment on CompanyPrivate {
      id
      orgId
      name
      siret
      vatNumber
      address
      naf
      libelleNaf
      userRole
      givenName
      ...AccountFieldCompanyTypesFragment
      ...AccountFieldCompanyGerepIdFragment
      ...AccountFieldCompanyGivenNameFragment
      ...AccountFieldCompanyTransporterReceiptFragment
      ...AccountFieldCompanyTraderReceiptFragment
      ...AccountFieldCompanyBrokerReceiptFragment
      ...AccountFieldCompanyVerificationStatusFragment
      ...AccountFieldCompanyVhuAgrementBroyeurFragment
      ...AccountFieldCompanyVhuAgrementDemolisseurFragment
      ...AccountFieldCompanyWorkerCertificationFragment
      installation {
        urlFiche
      }
    }
    ${AccountFieldCompanyTypesFragment.company}
    ${AccountFieldCompanyGerepIdFragment.company}
    ${AccountFieldCompanyGivenNameFragment.company}
    ${AccountFieldCompanyTransporterReceiptFragment.company}
    ${AccountFieldCompanyTraderReceiptFragment.company}
    ${AccountFieldCompanyBrokerReceiptFragment.company}
    ${AccountFieldCompanyVerificationStatusFragment.company}
    ${AccountFieldCompanyVhuAgrementBroyeurFragment.company}
    ${AccountFieldCompanyVhuAgrementDemolisseurFragment.company}
    ${AccountFieldCompanyWorkerCertificationFragment.company}
  `
};

const AccountFieldCompanySecurityCodeFragment = {
  company: gql`
    fragment AccountFieldCompanySecurityCodeFragment on CompanyPrivate {
      id
      orgId
      userRole
      securityCode
      allowBsdasriTakeOverWithoutSignature
    }
  `
};

const AccountFieldCompanySignatureAutomationFragment = {
  company: gql`
    fragment AccountFieldCompanySignatureAutomationFragment on CompanyPrivate {
      siret
      allowAppendix1SignatureAutomation
      signatureAutomations {
        id
        createdAt
        to {
          siret
          vatNumber
          name
        }
      }
    }
  `
};

const AccountCompanySecurityFragment = {
  company: gql`
    fragment AccountCompanySecurityFragment on CompanyPrivate {
      ...AccountFieldCompanySecurityCodeFragment
      ...AccountFieldCompanySignatureAutomationFragment
    }
    ${AccountFieldCompanySecurityCodeFragment.company}
    ${AccountFieldCompanySignatureAutomationFragment.company}
  `
};

const AccountFormCompanyInviteNewUserFragment = {
  company: gql`
    fragment AccountFormCompanyInviteNewUserFragment on CompanyPrivate {
      id
      orgId
    }
  `
};

export const AccountCompanyMemberFragment = {
  company: gql`
    fragment AccountCompanyMemberCompanyFragment on CompanyPrivate {
      orgId
      vatNumber
      siret
    }
  `,
  user: gql`
    fragment AccountCompanyMemberUserFragment on CompanyMember {
      id
      orgId
      isMe
      email
      name
      role
      isActive
      isPendingInvitation
    }
  `
};

const AccountCompanyMemberListFragment = {
  company: gql`
    fragment AccountCompanyMemberListFragment on CompanyPrivate {
      ...AccountCompanyMemberCompanyFragment
      ...AccountFormCompanyInviteNewUserFragment
      companyTypes
      verificationStatus
      users {
        ...AccountCompanyMemberUserFragment
      }
    }
    ${AccountFormCompanyInviteNewUserFragment.company}
    ${AccountCompanyMemberFragment.company}
    ${AccountCompanyMemberFragment.user}
  `
};

const AccountFieldCompanyContactFragment = {
  company: gql`
    fragment AccountFieldCompanyContactFragment on CompanyPrivate {
      id
      contact
      userRole
    }
  `
};

const AccountFieldCompanyContactEmailFragment = {
  company: gql`
    fragment AccountFieldCompanyContactEmailFragment on CompanyPrivate {
      id
      contactEmail
      userRole
    }
  `
};

const AccountFieldCompanyContactPhoneFragment = {
  company: gql`
    fragment AccountFieldCompanyContactPhoneFragment on CompanyPrivate {
      id
      contactPhone
      userRole
    }
  `
};

const AccountFieldCompanyContactWebsiteFragment = {
  company: gql`
    fragment AccountFieldCompanyWebsiteFragment on CompanyPrivate {
      id
      website
      userRole
    }
  `
};

const AccountFieldCompanyAgreementsFragment = {
  company: gql`
    fragment AccountFieldCompanyAgreementsFragment on CompanyPrivate {
      siret
      userRole
      ecoOrganismeAgreements
    }
  `
};

const AccountCompanyContactFragment = {
  company: gql`
    fragment AccountCompanyContactFragment on CompanyPrivate {
      orgId
      siret
      vatNumber
      companyTypes
      ...AccountFieldCompanyContactFragment
      ...AccountFieldCompanyContactEmailFragment
      ...AccountFieldCompanyContactPhoneFragment
      ...AccountFieldCompanyWebsiteFragment
      ...AccountFieldCompanyAgreementsFragment
    }
    ${AccountFieldCompanyContactFragment.company}
    ${AccountFieldCompanyContactEmailFragment.company}
    ${AccountFieldCompanyContactPhoneFragment.company}
    ${AccountFieldCompanyContactWebsiteFragment.company}
    ${AccountFieldCompanyAgreementsFragment.company}
  `
};

export const CompanyDetailsfragment = {
  company: gql`
    fragment CompanyDetailsFragment on CompanyPrivate {
      id
      name
      orgId
      siret
      vatNumber
      userRole
      featureFlags
      isDormantSince
      hasEnabledRegistryDndFromBsdSince
      ecoOrganismePartnersIds
      receivedSignatureAutomations {
        from {
          siret
        }
      }
      givenAdministrativeTransfers {
        id
        status
        createdAt
        approvedAt
      }
      receivedAdministrativeTransfers {
        id
        status
        approvedAt
        from {
          orgId
          name
        }
      }
      ...AccountCompanyInfoFragment
      ...AccountCompanySecurityFragment
      ...AccountCompanyMemberListFragment
      ...AccountCompanyContactFragment
    }
    ${AccountCompanyInfoFragment.company}
    ${AccountCompanySecurityFragment.company}
    ${AccountCompanyMemberListFragment.company}
    ${AccountCompanyContactFragment.company}
  `
};

export const AccountInfoAutoUpdateFragments = {
  company: gql`
    fragment AccountInfoAutoUpdateFragment on CompanyPrivate {
      id
      orgId
      name
      siret
      vatNumber
      address
      naf
      libelleNaf
      userRole
      givenName
      ...AccountFieldCompanyTypesFragment
      ...AccountFieldCompanyGerepIdFragment
      ...AccountFieldCompanyGivenNameFragment
      ...AccountFieldCompanyTransporterReceiptFragment
      ...AccountFieldCompanyTraderReceiptFragment
      ...AccountFieldCompanyBrokerReceiptFragment
      ...AccountFieldCompanyVerificationStatusFragment
      ...AccountFieldCompanyVhuAgrementBroyeurFragment
      ...AccountFieldCompanyVhuAgrementDemolisseurFragment
      ...AccountFieldCompanyWorkerCertificationFragment
      installation {
        urlFiche
      }
    }
    ${AccountFieldCompanyTypesFragment.company}
    ${AccountFieldCompanyGerepIdFragment.company}
    ${AccountFieldCompanyGivenNameFragment.company}
    ${AccountFieldCompanyTransporterReceiptFragment.company}
    ${AccountFieldCompanyTraderReceiptFragment.company}
    ${AccountFieldCompanyBrokerReceiptFragment.company}
    ${AccountFieldCompanyVerificationStatusFragment.company}
    ${AccountFieldCompanyVhuAgrementBroyeurFragment.company}
    ${AccountFieldCompanyVhuAgrementDemolisseurFragment.company}
    ${AccountFieldCompanyWorkerCertificationFragment.company}
  `
};

export const AccountFieldCompanyDasriDirectTakeOverFragments = {
  company: gql`
    fragment AccountFieldCompanySecurityCodeFragment on CompanyPrivate {
      id
      siret
      userRole
      allowBsdasriTakeOverWithoutSignature
    }
  `
};

export const AccountFieldCompanySignatureAutomationFragments = {
  company: gql`
    fragment AccountFieldCompanySignatureAutomationFragment on CompanyPrivate {
      siret
      allowAppendix1SignatureAutomation
      signatureAutomations {
        id
        createdAt
        to {
          siret
          vatNumber
          name
        }
      }
    }
  `
};
