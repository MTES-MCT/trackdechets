import { gql } from "@apollo/client";
import { transporterFormFragment } from "common/fragments";

export const GET_FORM = gql`
  query form($id: ID!) {
    form(id: $id) {
      ...TransporterFormFragment
    }
  }
  ${transporterFormFragment}
`;
