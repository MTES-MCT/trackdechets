import { gql } from "@apollo/client";
import { companyFragment } from "common/fragments";

export const fullVhuFormFragment = gql`
  fragment FullVhuForm on VhuForm {
    emitter {
      company {
        ...CompanyFragment
      }
      agreement
      validityLimit
    }
    recipient {
      company {
        ...CompanyFragment
      }
      agreement
      validityLimit
      operation {
        planned
      }
    }
    wasteDetails {
      packagingType
      identificationNumbers
      identificationType
      quantity
      quantityUnit
    }
    transporter {
      agreement
      company {
        ...CompanyFragment
      }
      receipt
      department
      validityLimit
      transportType
    }
  }
  ${companyFragment}
`;

export const GET_VHU_FORM = gql`
  query VhuForm($id: ID) {
    vhuForm(id: $id) {
      ...FullVhuForm
    }
  }
  ${fullVhuFormFragment}
`;

export const CREATE_VHU_FORM = gql`
  mutation CreateVhuForm($vhuFormInput: VhuFormInput!) {
    createVhuForm(vhuFormInput: $vhuFormInput) {
      ...FullVhuForm
    }
  }
  ${fullVhuFormFragment}
`;

export const EDIT_VHU_FORM = gql`
  mutation EditVhuForm($id: ID!, $vhuFormInput: vhuFormInput!) {
    editVhuForm(id: $id, vhuFormInput: $vhuFormInput) {
      ...FullVhuForm
    }
  }
  ${fullVhuFormFragment}
`;
