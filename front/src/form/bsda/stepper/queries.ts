import { gql } from "@apollo/client";
import { companyFragment } from "common/fragments";

export const FullBsdaFragment = gql`
  fragment FullBsda on Bsda {
    id
    isDraft
    status
    createdAt
    updatedAt
    type
    emitter {
      isPrivateIndividual
      company {
        ...CompanyFragment
      }
      emission {
        signature {
          author
          date
        }
      }
      pickupSite {
        address
        city
        infos
        name
        postalCode
      }
    }
    destination {
      cap
      plannedOperationCode
      company {
        ...CompanyFragment
      }
      reception {
        date
        weight
        acceptationStatus
        refusalReason
      }
      operation {
        code
        description
        date
        signature {
          author
          date
        }
        nextDestination {
          company {
            ...CompanyFragment
          }
          cap
          plannedOperationCode
        }
      }
    }
    packagings {
      other
      quantity
      type
    }
    waste {
      code
      familyCode
      materialName
      consistence
      sealNumbers
      adr
      pop
    }
    weight {
      value
      isEstimate
    }
    worker {
      company {
        ...CompanyFragment
      }
      work {
        signature {
          author
          date
        }
      }
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
    transporter {
      company {
        ...CompanyFragment
        vatNumber
      }
      customInfo
      recepisse {
        number
        department
        validityLimit
      }
      transport {
        mode
        plates
        takenOverAt
        signature {
          author
          date
        }
      }
    }
    metadata {
      errors {
        message
        requiredFor
      }
    }
    grouping {
      id
      waste {
        code
        materialName
      }
      destination {
        cap
        operation {
          nextDestination {
            cap
            company {
              siret
              name
            }
          }
        }
        reception {
          weight
        }
      }
    }
    forwarding {
      id
      waste {
        code
      }
      destination {
        cap
        operation {
          nextDestination {
            cap
          }
        }
        reception {
          weight
        }
      }
    }
    forwardedIn {
      id
      waste {
        code
      }
      destination {
        cap
        operation {
          nextDestination {
            cap
          }
        }
        reception {
          weight
        }
      }
    }
    groupedIn {
      id
      waste {
        code
      }
      destination {
        cap
      }
    }
  }
  ${companyFragment}
`;

export const GET_BSDA = gql`
  query Bsda($id: ID!) {
    bsda(id: $id) {
      ...FullBsda
    }
  }
  ${FullBsdaFragment}
`;

export const GET_BSDAS = gql`
  query Bsdas($where: BsdaWhere) {
    bsdas(where: $where) {
      totalCount
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          ...FullBsda
        }
      }
    }
  }
  ${FullBsdaFragment}
`;

export const DUPLICATE_BSDA = gql`
  mutation DuplicateBsda($id: ID!) {
    duplicateBsda(id: $id) {
      ...FullBsda
    }
  }
  ${FullBsdaFragment}
`;

export const CREATE_BSDA = gql`
  mutation CreateDraftBsda($input: BsdaInput!) {
    createDraftBsda(input: $input) {
      ...FullBsda
    }
  }
  ${FullBsdaFragment}
`;

export const UPDATE_BSDA = gql`
  mutation UpdateBsda($id: ID!, $input: BsdaInput!) {
    updateBsda(id: $id, input: $input) {
      ...FullBsda
    }
  }
  ${FullBsdaFragment}
`;

export const SIGN_BSDA = gql`
  mutation SignBsda($id: ID!, $input: BsdaSignatureInput!) {
    signBsda(id: $id, input: $input) {
      ...FullBsda
    }
  }
  ${FullBsdaFragment}
`;

export const GET_BSDA_PDF = gql`
  query PdfBsda($id: ID) {
    bsdaPdf(id: $id) {
      downloadLink
      token
    }
  }
`;
