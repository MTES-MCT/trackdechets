import gql from "graphql-tag";
import { fullFormFragment } from "../../common/fragments";

export const GET_FORM = gql`
  query Form($formId: ID) {
    form(id: $formId) {
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
