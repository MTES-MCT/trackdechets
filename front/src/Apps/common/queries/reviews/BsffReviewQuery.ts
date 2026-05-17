import { gql } from "@apollo/client";
import { companyFragment } from "../fragments";

const reviewFragment = gql`
  fragment BsffRevisionRequestFragment on BsffRevisionRequest {
    id
    createdAt
    bsff {
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
      worker {
        company {
          name
          orgId
        }
      }
      ecoOrganisme {
        siret
        name
      }
      waste {
        code
        familyCode
        materialName
        pop
        sealNumbers
      }
      weight {
        value
      }
      transporter {
        company {
          name
          siret
          orgId
        }
      }
      packagings {
        other
        quantity
        type
        volume
        identificationNumbers
      }
      broker {
        company {
          ...CompanyFragment
        }
        recepisse {
          number
          department
          validityLimit
        }
      }
      destination {
        cap
        company {
          name
          siret
          orgId
        }
        reception {
          weight
          refusedWeight
        }
        operation {
          code
          mode
          description
        }
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
        familyCode
        materialName
        pop
        sealNumbers
      }
      packagings {
        other
        quantity
        type
        volume
        identificationNumbers
      }
      broker {
        company {
          ...CompanyFragment
        }
        recepisse {
          number
          department
          validityLimit
        }
      }
      destination {
        cap
        reception {
          weight
          refusedWeight
        }
        operation {
          code
          mode
          description
        }
      }
      isCanceled
    }
    status
    comment
  }
  ${companyFragment}
`;

export const GET_BSFF_REVISION_REQUESTS = gql`
  query BsffRevisionRequests(
    $siret: String!
    $where: BsffRevisionRequestWhere
    $after: String
  ) {
    bsffRevisionRequests(siret: $siret, where: $where, after: $after) {
      edges {
        node {
          ...BsffRevisionRequestFragment
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

export const CREATE_BSFF_REVISION_REQUEST = gql`
  mutation CreateBsffRevisionRequest($input: CreateBsffRevisionRequestInput!) {
    createBsffRevisionRequest(input: $input) {
      id
    }
  }
`;

export const CANCEL_BSFF_REVISION_REQUEST = gql`
  mutation CancelBsffRevisionRequest($id: ID!) {
    cancelBsffRevisionRequest(id: $id)
  }
`;

export const SUBMIT_BSFF_REVISION_REQUEST_APPROVAL = gql`
  mutation SubmitBsffRevisionRequestApproval($id: ID!, $isApproved: Boolean!) {
    submitBsffRevisionRequestApproval(id: $id, isApproved: $isApproved) {
      id
      status
    }
  }
`;
