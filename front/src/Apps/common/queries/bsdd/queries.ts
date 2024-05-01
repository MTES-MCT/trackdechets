import { gql } from "@apollo/client";

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
