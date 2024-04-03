import { gql } from "@apollo/client";
import {
  CompanyDetailsfragment,
  AccountCompanyMemberFragment
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
