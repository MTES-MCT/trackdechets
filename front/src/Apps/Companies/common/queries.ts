import { gql } from "@apollo/client";
import {
  CompanyDetailsfragment,
  AccountCompanyMemberFragment,
  AccountInfoAutoUpdateFragments
} from "./fragments";
import AccountInfo from "../../Account/AccountInfo";

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

export const CREATE_TRANSPORTER_RECEIPT = gql`
  mutation CreateTransporterReceipt($input: CreateTransporterReceiptInput!) {
    createTransporterReceipt(input: $input) {
      id
    }
  }
`;

export const CREATE_TRADER_RECEIPT = gql`
  mutation CreateTraderReceipt($input: CreateTraderReceiptInput!) {
    createTraderReceipt(input: $input) {
      id
    }
  }
`;

export const CREATE_BROKER_RECEIPT = gql`
  mutation CreateBrokerReceipt($input: CreateBrokerReceiptInput!) {
    createBrokerReceipt(input: $input) {
      id
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

export const UPDATE_COMPANY_TYPES = gql`
  mutation UpdateCompany($id: String!, $companyTypes: [CompanyType!]) {
    updateCompany(id: $id, companyTypes: $companyTypes) {
      id
      companyTypes
    }
  }
`;

export const CREATE_TRANSPORTER_RECEIPT_ = gql`
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

export const UPDATE_COMPANY_TRANSPORTER_RECEIPT = gql`
  mutation UpdateCompany($id: String!, $transporterReceiptId: String!) {
    updateCompany(id: $id, transporterReceiptId: $transporterReceiptId) {
      id
      transporterReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
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

export const UPDATE_COMPANY_VHU_AGREMENT = gql`
  mutation UpdateCompany($id: String!, $vhuAgrementBroyeurId: String!) {
    updateCompany(id: $id, vhuAgrementBroyeurId: $vhuAgrementBroyeurId) {
      id
      vhuAgrementBroyeur {
        id
        agrementNumber
        department
      }
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

export const UPDATE_COMPANY_VHU_AGREMENT_DEMOLISSEUR = gql`
  mutation UpdateCompany($id: String!, $vhuAgrementDemolisseurId: String!) {
    updateCompany(
      id: $id
      vhuAgrementDemolisseurId: $vhuAgrementDemolisseurId
    ) {
      id
      vhuAgrementDemolisseur {
        id
        agrementNumber
        department
      }
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

export const CREATE_TRADER_RECEIPT_ = gql`
  mutation CreateTraderReceipt($input: CreateTraderReceiptInput!) {
    createTraderReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

export const UPDATE_COMPANY_TRADER_RECEIPT = gql`
  mutation UpdateCompany($id: String!, $traderReceiptId: String!) {
    updateCompany(id: $id, traderReceiptId: $traderReceiptId) {
      id
      traderReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
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

export const CREATE_BROKER_RECEIPT_ = gql`
  mutation CreateBrokerReceipt($input: CreateBrokerReceiptInput!) {
    createBrokerReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

export const UPDATE_COMPANY_BROKER_RECEIPT = gql`
  mutation UpdateCompany($id: String!, $brokerReceiptId: String!) {
    updateCompany(id: $id, brokerReceiptId: $brokerReceiptId) {
      id
      brokerReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
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

export const UPDATE_COMPANY_WORKER_CERTIFICATION = gql`
  mutation UpdateCompany($id: String!, $workerCertificationId: String!) {
    updateCompany(id: $id, workerCertificationId: $workerCertificationId) {
      id
      workerCertification {
        id
        hasSubSectionFour
        hasSubSectionThree
        certificationNumber
        validityLimit
        organisation
      }
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
