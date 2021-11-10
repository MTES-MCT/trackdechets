import { gql } from "@apollo/client";
import { companyFragment } from "common/fragments";

const reviewFragment = gql`
  fragment BsddRevisionRequestWithoutFormFragment on BsddRevisionRequest {
    id
    bsdd {
      id
    }
    author {
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
  }
  ${companyFragment}
`;

export const GET_BSDD_REVISION_REQUESTS = gql`
  query BsddRevisionRequests($siret: String!) {
    bsddRevisionRequests(siret: $siret) {
      edges {
        node {
          ...BsddRevisionRequestWithoutFormFragment
          bsdd {
            readableId
          }
        }
      }
    }
  }
  ${reviewFragment}
`;

export const CREATE_BSDD_REVISION_REQUEST = gql`
  mutation CreateBsddRevisionRequest(
    $bsddId: ID!
    $input: BsddRevisionRequestFormInput!
    $comment: String!
  ) {
    createBsddRevisionRequest(
      bsddId: $bsddId
      input: $input
      comment: $comment
    ) {
      id
    }
  }
`;

export const SUBMIT_BSDD_REVISION_REQUEST_APPROVAL = gql`
  mutation SubmitBsddRevisionRequestApproval($is: ID!, $isAccepted: Boolean!) {
    submitBsddRevisionRequestApproval(id: $id, isAccepted: $isAccepted) {
      id
    }
  }
`;
