import { gql } from "@apollo/client";

const reviewFragment = gql`
  fragment BsdasriRevisionRequestFragment on BsdasriRevisionRequest {
    id
    createdAt
    bsdasri {
      id
      status
      updatedAt
      type
      emitter {
        company {
          name
          siret
          orgId
        }
        pickupSite {
          name
          address
          city
          postalCode
          infos
        }
      }
      waste {
        code
      }

      transporter {
        company {
          name
          siret
          orgId
        }
      }

      destination {
        company {
          name
          siret
          orgId
        }
        reception {
          packagings {
            type
            other
            quantity
            volume
          }
        }
        operation {
          weight {
            value
          }
          code
          mode
        }
      }
      ecoOrganisme {
        name
        siret
      }
    }
    authoringCompany {
      orgId
      siret
      name
    }
    approvals {
      approverSiret
      status
    }
    content {
      emitter {
        pickupSite {
          name
          address
          city
          postalCode
          infos
        }
      }
      waste {
        code
      }

      destination {
        reception {
          packagings {
            type
            other
            quantity
            volume
          }
        }
        operation {
          weight
          code
          mode
        }
      }
      isCanceled
    }
    status
    comment
  }
`;

export const GET_BSDASRI_REVISION_REQUESTS = gql`
  query BsdasriRevisionRequests(
    $siret: String!
    $where: BsdasriRevisionRequestWhere
    $after: String
  ) {
    bsdasriRevisionRequests(siret: $siret, where: $where, after: $after) {
      edges {
        node {
          ...BsdasriRevisionRequestFragment
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${reviewFragment}
`;

export const CREATE_BSDASRI_REVISION_REQUEST = gql`
  mutation CreateBsdasriRevisionRequest(
    $input: CreateBsdasriRevisionRequestInput!
  ) {
    createBsdasriRevisionRequest(input: $input) {
      id
    }
  }
`;

export const CANCEL_BSDASRI_REVISION_REQUEST = gql`
  mutation CancelBsdasriRevisionRequest($id: ID!) {
    cancelBsdasriRevisionRequest(id: $id)
  }
`;

export const SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL = gql`
  mutation SubmitBsdasriRevisionRequestApproval(
    $id: ID!
    $isApproved: Boolean!
  ) {
    submitBsdasriRevisionRequestApproval(id: $id, isApproved: $isApproved) {
      id
      status
    }
  }
`;
