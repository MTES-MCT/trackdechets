import { gql } from "@apollo/client";
import {
  CompanyDetailsfragment,
  AccountCompanyMemberFragment,
  AccountInfoAutoUpdateFragments
} from "./fragments";
import AccountInfo from "../../Account/AccountInfo/AccountInfo";

export const UPDATE_CONTACT_INFOS = gql`
  mutation UpdateCompany(
    $id: String!
    $contact: String
    $contactEmail: String
    $contactPhone: String
    $website: String
  ) {
    updateCompany(
      id: $id
      contact: $contact
      contactEmail: $contactEmail
      contactPhone: $contactPhone
      website: $website
    ) {
      id
      contact
      contactEmail
      contactPhone
      website
      userRole
    }
  }
`;

export const INVITE_USER_TO_COMPANY = gql`
  mutation InviteUserToCompany(
    $email: String!
    $siret: String!
    $role: UserRole!
  ) {
    inviteUserToCompany(email: $email, siret: $siret, role: $role) {
      id
      users {
        ...AccountCompanyMemberUserFragment
      }
    }
  }
  ${AccountCompanyMemberFragment.user}
`;

export const GET_ME = gql`
  {
    me {
      ...AccountInfoFragment
    }
  }
  ${AccountInfo.fragments.me}
`;

export const DELETE_COMPANY = gql`
  mutation DeleteCompany($id: ID!) {
    deleteCompany(id: $id) {
      id
    }
  }
`;

export const TOGGLE_DORMANT_COMPANY = gql`
  mutation toggleDormantCompany($id: ID!) {
    toggleDormantCompany(id: $id)
  }
`;

export const CREATE_ADMINISTRATIVE_TRANSFER = gql`
  mutation CreateAdministrativeTransfer(
    $input: CreateAdministrativeTransferInput!
  ) {
    createAdministrativeTransfer(input: $input) {
      id
      status
    }
  }
`;

export const CANCEL_ADMINISTRATIVE_TRANSFER = gql`
  mutation CancelAdministrativeTransfer($id: ID!) {
    cancelAdministrativeTransfer(id: $id)
  }
`;

export const SUBMIT_ADMINISTRATIVE_TRANSFER_APPROVAL = gql`
  mutation SubmitAdministrativeTransferApproval(
    $input: SubmitAdministrativeTransferApprovalInput!
  ) {
    submitAdministrativeTransferApproval(input: $input) {
      id
      status
    }
  }
`;

// Requête utilisée pour afficher le détail d'un de mes établissements
export const MY_COMPANIES = gql`
  query MyCompanies($first: Int, $after: ID, $search: String) {
    myCompanies(first: $first, after: $after, search: $search) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          ...CompanyDetailsFragment
        }
      }
    }
  }
  ${CompanyDetailsfragment.company}
`;

export const COMPANY_ADMIN_PRIVATE_INFOS = gql`
  query CompanyPrivateInfos($clue: String!) {
    companyPrivateInfos(clue: $clue) {
      orgId
      siret
      name
      address
      isRegistered
      vatNumber
      codePaysEtrangerEtablissement
      userRole
      companyTypes
      verificationStatus
      users {
        ...AccountCompanyMemberUserFragment
      }
    }
  }
  ${AccountCompanyMemberFragment.user}
`;

export const REMOVE_USER_FROM_COMPANY = gql`
  mutation RemoveUserFromCompany($userId: ID!, $siret: String!) {
    removeUserFromCompany(userId: $userId, siret: $siret) {
      id
      users {
        ...AccountCompanyMemberUserFragment
      }
    }
  }
  ${AccountCompanyMemberFragment.user}
`;

export const DELETE_INVITATION = gql`
  mutation DeleteInvitation($email: String!, $siret: String!) {
    deleteInvitation(email: $email, siret: $siret) {
      id
      users {
        ...AccountCompanyMemberUserFragment
      }
    }
  }
  ${AccountCompanyMemberFragment.user}
`;

export const RESEND_INVITATION = gql`
  mutation ResendInvitation($email: String!, $siret: String!) {
    resendInvitation(email: $email, siret: $siret)
  }
`;

export const CREATE_COMPANY = gql`
  mutation CreateCompany($companyInput: PrivateCompanyInput!) {
    createCompany(companyInput: $companyInput) {
      id
      name
      givenName
      siret
      vatNumber
      companyTypes
    }
  }
`;

export const CREATE_VHU_AGREMENT = gql`
  mutation CreateVhuAgrement($input: CreateVhuAgrementInput!) {
    createVhuAgrement(input: $input) {
      id
    }
  }
`;

export const CREATE_TEST_COMPANY = gql`
  mutation CreateTestCompany {
    createTestCompany
  }
`;

export const SEND_MEMBERSHIP_REQUEST = gql`
  mutation SendMembershipRequest($siret: String!) {
    sendMembershipRequest(siret: $siret) {
      email
      sentTo
    }
  }
`;

export const UPDATE_COMPANY_NAME_ADRESS = gql`
  mutation UpdateCompany($id: String!) {
    updateCompany(id: $id) {
      ...AccountInfoAutoUpdateFragment
    }
  }
  ${AccountInfoAutoUpdateFragments.company}
`;

export const UPDATE_GIVEN_NAME_OR_GEREP_ID = gql`
  mutation UpdateCompany($id: String!, $givenName: String, $gerepId: String) {
    updateCompany(id: $id, givenName: $givenName, gerepId: $gerepId) {
      id
      givenName
      gerepId
      userRole
    }
  }
`;

export const UPDATE_COMPANY_PROFILE = gql`
  mutation UpdateCompany(
    $id: String!
    $companyTypes: [CompanyType!]
    $collectorTypes: [CollectorType!]
    $wasteProcessorTypes: [WasteProcessorType!]
    $wasteVehiclesTypes: [WasteVehiclesType!]
    $transporterReceiptId: String
    $traderReceiptId: String
    $brokerReceiptId: String
    $vhuAgrementDemolisseurId: String
    $vhuAgrementBroyeurId: String
    $workerCertificationId: String
    $ecoOrganismeAgreements: [URL!]
    $ecoOrganismePartnersIds: [String!]
  ) {
    updateCompany(
      id: $id
      companyTypes: $companyTypes
      collectorTypes: $collectorTypes
      wasteProcessorTypes: $wasteProcessorTypes
      wasteVehiclesTypes: $wasteVehiclesTypes
      transporterReceiptId: $transporterReceiptId
      traderReceiptId: $traderReceiptId
      brokerReceiptId: $brokerReceiptId
      vhuAgrementDemolisseurId: $vhuAgrementDemolisseurId
      vhuAgrementBroyeurId: $vhuAgrementBroyeurId
      workerCertificationId: $workerCertificationId
      ecoOrganismeAgreements: $ecoOrganismeAgreements
      ecoOrganismePartnersIds: $ecoOrganismePartnersIds
    ) {
      id
      companyTypes
      collectorTypes
      wasteProcessorTypes
      wasteVehiclesTypes
      transporterReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
      traderReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
      brokerReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
      vhuAgrementDemolisseur {
        id
        agrementNumber
        department
      }
      vhuAgrementBroyeur {
        id
        agrementNumber
        department
      }
      workerCertification {
        id
        hasSubSectionFour
        hasSubSectionThree
        certificationNumber
        validityLimit
        organisation
      }
      ecoOrganismeAgreements
      ecoOrganismePartnersIds
    }
  }
`;

export const CREATE_TRANSPORTER_RECEIPT = gql`
  mutation CreateTransporterReceipt($input: CreateTransporterReceiptInput!) {
    createTransporterReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

export const UPDATE_TRANSPORTER_RECEIPT = gql`
  mutation UpdateTransporterReceipt($input: UpdateTransporterReceiptInput!) {
    updateTransporterReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

export const DELETE_TRANSPORTER_RECEIPT = gql`
  mutation DeleteTransporterReceipt($input: DeleteTransporterReceiptInput!) {
    deleteTransporterReceipt(input: $input) {
      id
    }
  }
`;

export const UPDATE_VHU_AGREMENT = gql`
  mutation UpdateVhuAgrement($input: UpdateVhuAgrementInput!) {
    updateVhuAgrement(input: $input) {
      id
      agrementNumber
      department
    }
  }
`;

export const CREATE_VHU_AGREMENT_ = gql`
  mutation CreateVhuAgrement($input: CreateVhuAgrementInput!) {
    createVhuAgrement(input: $input) {
      id
      agrementNumber
      department
    }
  }
`;

export const DELETE_VHU_AGREMENT = gql`
  mutation DeleteVhuAgrement($input: DeleteVhuAgrementInput!) {
    deleteVhuAgrement(input: $input) {
      id
    }
  }
`;

export const UPDATE_TRADER_RECEIPT = gql`
  mutation UpdateTraderReceipt($input: UpdateTraderReceiptInput!) {
    updateTraderReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

export const CREATE_TRADER_RECEIPT = gql`
  mutation CreateTraderReceipt($input: CreateTraderReceiptInput!) {
    createTraderReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

export const DELETE_TRADER_RECEIPT = gql`
  mutation DeleteTraderReceipt($input: DeleteTraderReceiptInput!) {
    deleteTraderReceipt(input: $input) {
      id
    }
  }
`;

export const UPDATE_BROKER_RECEIPT = gql`
  mutation UpdateBrokerReceipt($input: UpdateBrokerReceiptInput!) {
    updateBrokerReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

export const CREATE_BROKER_RECEIPT = gql`
  mutation CreateBrokerReceipt($input: CreateBrokerReceiptInput!) {
    createBrokerReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

export const DELETE_BROKER_RECEIPT = gql`
  mutation DeleteBrokerReceipt($input: DeleteBrokerReceiptInput!) {
    deleteBrokerReceipt(input: $input) {
      id
    }
  }
`;

export const UPDATE_WORKER_CERTIFICATION = gql`
  mutation UpdateWorkerCertification($input: UpdateWorkerCertificationInput!) {
    updateWorkerCertification(input: $input) {
      id
      hasSubSectionFour
      hasSubSectionThree
      certificationNumber
      validityLimit
      organisation
    }
  }
`;

export const CREATE_WORKER_CERTIFICATION = gql`
  mutation CreateWorkerCertification($input: CreateWorkerCertificationInput!) {
    createWorkerCertification(input: $input) {
      id
      hasSubSectionFour
      hasSubSectionThree
      certificationNumber
      validityLimit
      organisation
    }
  }
`;

export const DELETE_WORKER_CERTIFICATION = gql`
  mutation DeleteWorkerCertification($input: DeleteWorkerCertificationInput!) {
    deleteWorkerCertification(input: $input) {
      id
    }
  }
`;

export const RENEW_SECURITY_CODE = gql`
  mutation RenewSecurityCode($siret: String!) {
    renewSecurityCode(siret: $siret) {
      id
      securityCode
    }
  }
`;

export const UPDATE_DASRI_DIRECT_TAKEOVER = gql`
  mutation UpdateCompany(
    $id: String!
    $allowBsdasriTakeOverWithoutSignature: Boolean!
  ) {
    updateCompany(
      id: $id
      allowBsdasriTakeOverWithoutSignature: $allowBsdasriTakeOverWithoutSignature
    ) {
      id
      siret
      allowBsdasriTakeOverWithoutSignature
    }
  }
`;

export const UPDATE_ALLOW_APPENDIX_SIGNATURE_AUTOMATION = gql`
  mutation UpdateCompany(
    $id: String!
    $allowAppendix1SignatureAutomation: Boolean!
  ) {
    updateCompany(
      id: $id
      allowAppendix1SignatureAutomation: $allowAppendix1SignatureAutomation
    ) {
      id
      siret
      allowAppendix1SignatureAutomation
    }
  }
`;

export const ADD_SIGNATURE_DELEGATION = gql`
  mutation AddSignatureAutomation($input: SignatureAutomationInput!) {
    addSignatureAutomation(input: $input) {
      id
      createdAt
      to {
        name
        siret
        vatNumber
      }
    }
  }
`;

export const REMOVE_SIGNATURE_DELEGATION = gql`
  mutation RemoveSignatureAutomation($id: ID!) {
    removeSignatureAutomation(id: $id) {
      id
    }
  }
`;

export const CHANGE_USER_ROLE = gql`
  mutation ChangeUserRole($userId: ID!, $orgId: ID!, $role: UserRole!) {
    changeUserRole(userId: $userId, orgId: $orgId, role: $role) {
      ...AccountCompanyMemberUserFragment
    }
  }
  ${AccountCompanyMemberFragment.user}
`;

export const MEMBERSHIP_REQUESTS = gql`
  query membershipRequests(
    $skip: Int
    $first: Int
    $where: MembershipRequestsWhere
  ) {
    membershipRequests(skip: $skip, first: $first, where: $where) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          id
          email
          name
          status
          createdAt
        }
      }
    }
  }
`;

export const MEMBERSHIP_REQUEST = gql`
  query MembershipRequest($id: ID!) {
    membershipRequest(id: $id) {
      id
      email
      name
      status
    }
  }
`;

export const ACCEPT_MEMBERSHIP_REQUEST = gql`
  mutation AcceptMembershipRequest($id: ID!, $role: UserRole!) {
    acceptMembershipRequest(id: $id, role: $role) {
      id
    }
  }
`;

export const REFUSE_MEMBERSHIP_REQUEST = gql`
  mutation RefuseMembershipRequest($id: ID!) {
    refuseMembershipRequest(id: $id) {
      id
    }
  }
`;
