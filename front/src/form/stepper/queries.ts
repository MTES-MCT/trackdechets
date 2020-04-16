import gql from "graphql-tag";
import { fullFormFragment, editableFormFragment } from "../../common/fragments";

export const GET_FORM = gql`
  query Form($formId: ID) {
    form(id: $formId) {
      ...EditableForm
    }
  }
  ${editableFormFragment}
`;

export const SAVE_FORM = gql`
  mutation SaveForm($formInput: FormInput!) {
    saveForm(formInput: $formInput) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;
