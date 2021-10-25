import { gql } from "@apollo/client";
import { companyFragment } from "common/fragments";

export const FullBsdaFragment = gql`
  fragment FullBsda on Bsda {
    id
    isDraft
    status
    createdAt
    updatedAt
    emitter {
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
        date
        signature {
          author
          date
        }
        nextDestination {
          company {
            ...CompanyFragment
          }
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
      name
      familyCode
      materialName
      consistence
      sealNumbers
      adr
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
