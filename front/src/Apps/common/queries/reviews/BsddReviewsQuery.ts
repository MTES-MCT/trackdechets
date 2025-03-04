import { gql } from "@apollo/client";
import { companyFragment } from "../fragments";

const reviewFragment = gql`
  fragment FormRevisionRequestFragment on FormRevisionRequest {
    id
    createdAt
    form {
      id
      status
      readableId
      stateSummary {
        lastActionOn
      }
      transporter {
        company {
          name
          siret
          orgId
        }
      }
      recipient {
        company {
          name
          siret
          orgId
        }
      }
      emitter {
        type
        company {
          name
          siret
          orgId
        }
      }
      ecoOrganisme {
        siret
        name
      }
      wasteDetails {
        code
        name
        pop
        quantity
        packagingInfos {
          type
          other
          quantity
          volume
          identificationNumbers
        }
        quantity
        sampleNumber
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
      quantityRefused
      processingOperationDone
      destinationOperationMode
      processingOperationDescription
      temporaryStorageDetail {
        temporaryStorer {
          quantityReceived
        }
        destination {
          cap
          processingOperation
        }
      }
      ecoOrganisme {
        siret
        name
      }
    }
    authoringCompany {
      siret
      orgId
      name
    }
    approvals {
      approverSiret
      status
    }
    content {
      wasteDetails {
        code
        name
        pop
        packagingInfos {
          type
          other
          quantity
          volume
          identificationNumbers
        }
        quantity
        sampleNumber
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
      quantityRefused
      processingOperationDone
      destinationOperationMode
      processingOperationDescription
      temporaryStorageDetail {
        temporaryStorer {
          quantityReceived
        }
        destination {
          cap
          processingOperation
        }
      }
      isCanceled
    }
    status
    comment
  }
  ${companyFragment}
`;

export const GET_FORM_REVISION_REQUESTS = gql`
  query FormRevisionRequests(
    $siret: String!
    $where: FormRevisionRequestWhere
    $after: String
  ) {
    formRevisionRequests(siret: $siret, where: $where, after: $after) {
      edges {
        node {
          ...FormRevisionRequestFragment
        }
      }
      pageInfo {
        endCursor
        hasNextPage
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
      approvals {
        approverSiret
        status
      }
    }
  }
`;
