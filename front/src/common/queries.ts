import { detailFormFragment } from "./fragments";
import gql from "graphql-tag";

// full fledged form to display in detailled views
export const GET_DETAIL_FORM = gql`
  query Form($id: ID) {
    form(id: $id) {
      ...DetailFormFragment
    }
  }
  ${detailFormFragment}
`;
