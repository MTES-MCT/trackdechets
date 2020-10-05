import gql from "graphql-tag";
import { fullFormFragment } from "src/common/fragments";

export const GET_FORM = gql`
  query Form($id: ID) {
    form(id: $id) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

export const SAVE_FORM = gql`
  mutation SaveForm($formInput: FormInput!) {
    saveForm(formInput: $formInput) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;
