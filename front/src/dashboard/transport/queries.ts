import { gql } from "@apollo/client";
import { transporterFormFragment } from "common/fragments";

export const GET_TRANSPORT_BSDS = gql`
  query GetTransportBsds(
    $siret: String
    $status: [FormStatus!]
    $roles: [FormRole!]
  ) {
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
