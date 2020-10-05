import gql from "graphql-tag";
import { transporterFormFragment } from "src/common/fragments";
export const GET_TRANSPORT_SLIPS = gql`
  query GetSlips($siret: String, $status: [FormStatus!], $roles: [FormRole!]) {
    forms(siret: $siret, status: $status, roles: $roles) {
      ...TransporterFormFragment
    }
  }
  ${transporterFormFragment}
`;

export const GET_FORM = gql`
  query form($id: ID!) {
    form(id: $id) {
      ...TransporterFormFragment
    }
  }
  ${transporterFormFragment}
`;


