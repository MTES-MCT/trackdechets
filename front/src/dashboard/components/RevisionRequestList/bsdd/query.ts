import { gql } from "@apollo/client";
import { companyFragment } from "common/fragments";

const reviewFragment = gql`
  fragment FormRevisionRequestFragment on FormRevisionRequest {
    id
    form {
      id
      wasteDetails {
        code
        pop
      }
      trader {
        company {
          ...CompanyFragment
        }
        receipt
        department
        validityLimit
      }
      broker {
        company {
          ...CompanyFragment
        }
        receipt
        department
        validityLimit
      }
      recipient {
        cap
      }
      quantityReceived
      processingOperationDone
      temporaryStorageDetail {
        destination {
          cap
          processingOperation
        }
      }
    }
    authoringCompany {
      siret
      name
    }
    approvals {
      approverSiret
      status
    }
    content {
      wasteDetails {
        code
        pop
      }
      trader {
        company {
          ...CompanyFragment
        }
        receipt
        department
        validityLimit
      }
      broker {
        company {
          ...CompanyFragment
        }
        receipt
        department
        validityLimit
      }
      recipient {
        cap
      }
      quantityReceived
      processingOperationDone
      temporaryStorageDetail {
        destination {
          cap
          processingOperation
        }
      }
    }
    status
    comment
  }
  ${companyFragment}
`;

export const GET_FORM_REVISION_REQUESTS = gql`
  query FormRevisionRequests($siret: String!) {
    formRevisionRequests(siret: $siret) {
      edges {
        node {
          ...FormRevisionRequestFragment
          bsdd {
            readableId
          }
        }
      }
    }
  }
  ${reviewFragment}
`;

export const CREATE_FORM_REVISION_REQUEST = gql`
  mutation CreateFormRevisionRequest($input: CreateFormRevisionRequestInput!) {
    createFormRevisionRequest(input: $input) {
      id
    }
  }
`;

export const CANCEL_FORM_REVISION_REQUEST = gql`
  mutation CancelFormRevisionRequest($id: ID!) {
    cancelFormRevisionRequest(id: $id)
  }
`;

export const SUBMIT_FORM_REVISION_REQUEST_APPROVAL = gql`
  mutation SubmitFormRevisionRequestApproval($id: ID!, $isApproved: Boolean!) {
    submitFormRevisionRequestApproval(id: $id, isApproved: $isApproved) {
      id
      status
    }
  }
`;
