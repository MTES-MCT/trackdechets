import { gql } from "@apollo/client";
import { companyFragment } from "common/fragments";

export const FullBsvhuFragment = gql`
  fragment FullBsvhu on Bsvhu {
    id
    isDraft
    status
    readableId
    emitter {
      company {
        ...CompanyFragment
      }
      agrementNumber
      signature {
        author
        date
      }
    }
    recipient {
      type
      company {
        ...CompanyFragment
      }
      agrementNumber
      acceptance {
        quantity
        status
        refusalReason
        identification {
          numbers
          type
        }
      }
      operation {
        planned
        done
      }
      plannedBroyeurCompany {
        ...CompanyFragment
      }
      signature {
        author
        date
      }
    }
    packaging
    wasteCode
    identification {
      numbers
      type
    }
    quantity {
      number
      tons
    }
    transporter {
      company {
        ...CompanyFragment
      }
      tvaIntracommunautaire
      recepisse {
        number
        department
        validityLimit
      }
      signature {
        author
        date
      }
    }
  }
  ${companyFragment}
`;

export const GET_VHU_FORM = gql`
  query Bsvhu($id: ID!) {
    bsvhu(id: $id) {
      ...FullBsvhu
    }
  }
  ${FullBsvhuFragment}
`;

export const GET_VHU_FORMS = gql`
  query Bsvhus($siret: String) {
    bsvhus(where: { siret: $siret }) {
      totalCount
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          ...FullBsvhu
          metadata {
            errors {
              message
              path
            }
          }
        }
      }
    }
  }
  ${FullBsvhuFragment}
`;

export const DUPLICATE_VHU_FORM = gql`
  mutation DuplicateBsvhu($id: ID!) {
    duplicateBsvhu(id: $id) {
      ...FullBsvhu
    }
  }
  ${FullBsvhuFragment}
`;

export const CREATE_VHU_FORM = gql`
  mutation CreateBsvhu($input: BsvhuInput!) {
    createBsvhu(input: $input) {
      ...FullBsvhu
    }
  }
  ${FullBsvhuFragment}
`;

export const UPDATE_VHU_FORM = gql`
  mutation UpdateBsvhu($id: ID!, $input: BsvhuInput!) {
    updateBsvhu(id: $id, input: $input) {
      ...FullBsvhu
    }
  }
  ${FullBsvhuFragment}
`;

export const SIGN_VHU_FORM = gql`
  mutation SignBsvhu($id: ID!, $input: BsvhuSignatureInput!) {
    signBsvhu(id: $id, input: $input) {
      ...FullBsvhu
    }
  }
  ${FullBsvhuFragment}
`;

export const PDF_VHU_FORM = gql`
  query PdfBsvhu($id: ID) {
    bsvhuPdf(id: $id) {
      downloadLink
      token
    }
  }
`;
