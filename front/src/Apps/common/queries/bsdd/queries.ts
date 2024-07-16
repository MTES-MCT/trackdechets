import { gql } from "@apollo/client";
import { transporterFragment } from "../fragments";
import { fullFormFragment } from "../fragments";
import { statusChangeFragment } from "../fragments";

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

export const GET_FORM = gql`
  query Form($id: ID) {
    form(id: $id) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

export const CREATE_FORM = gql`
  mutation CreateForm($createFormInput: CreateFormInput!) {
    createForm(createFormInput: $createFormInput) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

export const UPDATE_FORM = gql`
  mutation UpdateForm($updateFormInput: UpdateFormInput!) {
    updateForm(updateFormInput: $updateFormInput) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;
export const MARK_AS_RECEIVED = gql`
  mutation MarkAsReceived($id: ID!, $receivedInfo: ReceivedFormInput!) {
    markAsReceived(id: $id, receivedInfo: $receivedInfo) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export const MARK_AS_TEMP_STORED = gql`
  mutation MarkAsTempStored($id: ID!, $tempStoredInfos: TempStoredFormInput!) {
    markAsTempStored(id: $id, tempStoredInfos: $tempStoredInfos) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export const MARK_TEMP_STORER_ACCEPTED = gql`
  mutation MarkAsTempStorerAccepted(
    $id: ID!
    $tempStorerAcceptedInfo: TempStorerAcceptedFormInput!
  ) {
    markAsTempStorerAccepted(
      id: $id
      tempStorerAcceptedInfo: $tempStorerAcceptedInfo
    ) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export const MARK_AS_ACCEPTED = gql`
  mutation MarkAsAccepted($id: ID!, $acceptedInfo: AcceptedFormInput!) {
    markAsAccepted(id: $id, acceptedInfo: $acceptedInfo) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;
