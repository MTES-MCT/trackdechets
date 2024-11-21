import { gql } from "@apollo/client";
import { companyFragment } from "../fragments";

const reviewFragment = gql`
  fragment BsdaRevisionRequestFragment on BsdaRevisionRequest {
    id
    createdAt
    bsda {
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
          siret
          orgId
        }
      }
      waste {
        code
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
        materialName
        pop
        sealNumbers
      }
      packagings {
        other
        quantity
        type
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

export const GET_BSDA_REVISION_REQUESTS = gql`
  query BsdaRevisionRequests(
    $siret: String!
    $where: BsdaRevisionRequestWhere
    $after: String
  ) {
    bsdaRevisionRequests(siret: $siret, where: $where, after: $after) {
      edges {
        node {
          ...BsdaRevisionRequestFragment
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

export const CREATE_BSDA_REVISION_REQUEST = gql`
  mutation CreateBsdaRevisionRequest($input: CreateBsdaRevisionRequestInput!) {
    createBsdaRevisionRequest(input: $input) {
      id
    }
  }
`;

export const CANCEL_BSDA_REVISION_REQUEST = gql`
  mutation CancelBsdaRevisionRequest($id: ID!) {
    cancelBsdaRevisionRequest(id: $id)
  }
`;

export const SUBMIT_BSDA_REVISION_REQUEST_APPROVAL = gql`
  mutation SubmitBsdaRevisionRequestApproval($id: ID!, $isApproved: Boolean!) {
    submitBsdaRevisionRequestApproval(id: $id, isApproved: $isApproved) {
      id
      status
    }
  }
`;
