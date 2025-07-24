import { gql } from "@apollo/client";
import { detailFormFragment, fullDasriFragment } from "../fragments";

// full fledged bsd to display in detailled views
export const GET_DETAIL_FORM = gql`
  query Form($id: ID) {
    form(id: $id) {
      ...DetailFormFragment
    }
  }
  ${detailFormFragment}
`;

export const GET_DETAIL_DASRI = gql`
  query Bsdasri($id: ID!) {
    bsdasri(id: $id) {
      ...DasriFragment
    }
  }
  ${fullDasriFragment}
`;

export const GET_DETAIL_DASRI_WITH_METADATA = gql`
  query Bsdasri($id: ID!) {
    bsdasri(id: $id) {
      ...DasriFragment
      metadata {
        errors {
          message
          requiredFor
        }
      }
    }
  }
  ${fullDasriFragment}
`;
