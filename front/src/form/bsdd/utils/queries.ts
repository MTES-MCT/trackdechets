import { gql } from "@apollo/client";
import { fullFormFragment } from "../../../Apps/common/queries/fragments";

export const GET_FORM = gql`
  query Form($id: ID) {
    form(id: $id) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

export const CREATE_FORM = gql`
  mutation CreateForm($createFormInput: CreateFormInput!) {
    createForm(createFormInput: $createFormInput) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

export const UPDATE_FORM = gql`
  mutation UpdateForm($updateFormInput: UpdateFormInput!) {
    updateForm(updateFormInput: $updateFormInput) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;
