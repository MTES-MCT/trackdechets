import { gql } from "@apollo/client";
import { companyFragment } from "common/fragments";

export const fullVhuFormFragment = gql`
  fragment FullVhuForm on VhuForm {
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
  query VhuForm($id: ID!) {
    bordereauVhu {
      findUnique(id: $id) {
        ...FullVhuForm
      }
    }
  }
  ${fullVhuFormFragment}
`;

export const GET_VHU_FORMS = gql`
  query VhuForm($siret: String) {
    bordereauVhu {
      findMany(siret: $siret) {
        ...FullVhuForm
      }
    }
  }
  ${fullVhuFormFragment}
`;

export const DUPLICATE_VHU_FORM = gql`
  mutation DuplicateVhuForm($id: ID!) {
    bordereauVhu {
      duplicate(id: $id) {
        ...FullVhuForm
      }
    }
  }
  ${fullVhuFormFragment}
`;

export const CREATE_VHU_FORM = gql`
  mutation CreateVhuForm($input: VhuFormInput!) {
    bordereauVhu {
      create(input: $input) {
        ...FullVhuForm
      }
    }
  }
  ${fullVhuFormFragment}
`;

export const UPDATE_VHU_FORM = gql`
  mutation UpdateVhuForm($id: ID!, $input: VhuFormInput!) {
    bordereauVhu {
      update(id: $id, input: $input) {
        ...FullVhuForm
      }
    }
  }
  ${fullVhuFormFragment}
`;

export const SIGN_VHU_FORM = gql`
  mutation SignVhuForm($id: ID!, $input: VhuSignatureInput!) {
    bordereauVhu {
      sign(id: $id, input: $input) {
        ...FullVhuForm
      }
    }
  }
  ${fullVhuFormFragment}
`;

export const PDF_VHU_FORM = gql`
  query PdfVhuForm($id: ID) {
    bordereauVhu {
      pdf(id: $id) {
        downloadLink
        token
      }
    }
  }
`;
