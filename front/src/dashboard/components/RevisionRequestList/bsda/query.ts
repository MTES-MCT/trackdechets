import { gql } from "@apollo/client";
import { companyFragment } from "common/fragments";

const reviewFragment = gql`
  fragment BsdaRevisionRequestFragment on BsdaRevisionRequest {
    id
    bsda {
      id
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
          description
        }
      }
    }
    status
    comment
  }
  ${companyFragment}
`;

export const GET_BSDA_REVISION_REQUESTS = gql`
  query BsdaRevisionRequests($siret: String!) {
    bsdaRevisionRequests(siret: $siret) {
      edges {
        node {
          ...BsdaRevisionRequestFragment
        }
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
