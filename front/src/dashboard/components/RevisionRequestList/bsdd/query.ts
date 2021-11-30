import { gql } from "@apollo/client";
import { companyFragment } from "common/fragments";

const reviewFragment = gql`
  fragment BsddRevisionRequestFragment on BsddRevisionRequest {
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
          ...BsddRevisionRequestFragment
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
    $content: BsddRevisionRequestContentInput!
    $comment: String!
  ) {
    createBsddRevisionRequest(
      bsddId: $bsddId
      content: $content
      comment: $comment
    ) {
      id
    }
  }
`;

export const SUBMIT_BSDD_REVISION_REQUEST_APPROVAL = gql`
  mutation SubmitBsddRevisionRequestApproval($is: ID!, $isApproved: Boolean!) {
    submitBsddRevisionRequestApproval(id: $id, isApproved: $isApproved) {
      id
    }
  }
`;
