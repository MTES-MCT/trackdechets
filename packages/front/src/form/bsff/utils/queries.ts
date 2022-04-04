import { gql } from "@apollo/client";
import { companyFragment } from "common/fragments";

export const FicheInterventionFragment = gql`
  fragment FicheInterventionFragment on BsffFicheIntervention {
    id
    numero
    weight
    postalCode
  }
`;

export const FullBsffFragment = gql`
  fragment FullBsff on Bsff {
    id
    type
    status
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
    }
    packagings {
      name
      numero
      volume
      weight
    }
    waste {
      code
      description
      adr
    }
    weight {
      value
      isEstimate
    }
    transporter {
      company {
        ...CompanyFragment
      }
      recepisse {
        number
        department
        validityLimit
      }
      transport {
        mode
        signature {
          author
          date
        }
      }
    }
    destination {
      company {
        ...CompanyFragment
      }
      reception {
        date
        weight
        acceptation {
          status
          refusalReason
        }
        signature {
          author
          date
        }
      }
      operation {
        code
        nextDestination {
          company {
            ...CompanyFragment
          }
        }
        signature {
          author
          date
        }
      }
      plannedOperationCode
      cap
    }
    ficheInterventions {
      ...FicheInterventionFragment
    }
    grouping {
      id
    }
    groupedIn {
      id
    }
    repackaging {
      id
    }
    repackagedIn {
      id
    }
    forwarding {
      id
    }
    forwardedIn {
      id
    }
  }
  ${companyFragment}
  ${FicheInterventionFragment}
`;

export const GET_BSFF_FORM = gql`
  query Bsff($id: ID!) {
    bsff(id: $id) {
      ...FullBsff
    }
  }
  ${FullBsffFragment}
`;

export const GET_BSFF_FORMS = gql`
  query Bsffs($where: BsffWhere) {
    bsffs(where: $where) {
      totalCount
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          ...FullBsff
        }
      }
    }
  }
  ${FullBsffFragment}
`;

export const CREATE_DRAFT_BSFF = gql`
  mutation CreateDraftBsff($input: BsffInput!) {
    createDraftBsff(input: $input) {
      ...FullBsff
    }
  }
  ${FullBsffFragment}
`;

export const UPDATE_BSFF_FORM = gql`
  mutation UpdateBsff($id: ID!, $input: BsffInput!) {
    updateBsff(id: $id, input: $input) {
      ...FullBsff
    }
  }
  ${FullBsffFragment}
`;

export const SIGN_BSFF = gql`
  mutation SignBsff(
    $id: ID!
    $type: BsffSignatureType!
    $signature: SignatureInput!
  ) {
    signBsff(id: $id, type: $type, signature: $signature) {
      ...FullBsff
    }
  }
  ${FullBsffFragment}
`;

export const PDF_BSFF_FORM = gql`
  query PdfBsff($id: ID!) {
    bsffPdf(id: $id) {
      downloadLink
      token
    }
  }
`;
