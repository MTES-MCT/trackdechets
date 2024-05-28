import { gql } from "@apollo/client";
import { transporterFragment } from "../fragments";

export const UPDATE_TRANSPORT_INFO = gql`
  mutation updateTransporterFields(
    $id: ID!
    $transporterNumberPlate: String
    $transporterCustomInfo: String
  ) {
    updateTransporterFields(
      id: $id
      transporterNumberPlate: $transporterNumberPlate
      transporterCustomInfo: $transporterCustomInfo
    ) {
      id
      transporter {
        numberPlate
        customInfo
      }
      # query stateSummary to update the cache
      stateSummary {
        transporterCustomInfo
        transporterNumberPlate
      }
    }
  }
`;

export const UPDATE_BSDD_TRANSPORTER = gql`
  mutation updateFormTransporter($id: ID!, $input: TransporterInput!) {
    updateFormTransporter(id: $id, input: $input) {
      ...TransporterFragment
    }
  }
  ${transporterFragment}
`;
