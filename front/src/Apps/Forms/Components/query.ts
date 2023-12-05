import gql from "graphql-tag";

export const TransporterFragment = gql`
  fragment TransporterFragment on Transporter {
    id
    company {
      name
      orgId
      siret
      address
      country
      contact
      phone
      mail
      vatNumber
      omiNumber
    }
    isExemptedOfReceipt
    receipt
    department
    validityLimit
    numberPlate
    customInfo
    mode
  }
`;

export const CREATE_FORM_TRANSPORTER = gql`
  mutation CreateFormTransporter($input: TransporterInput!) {
    createFormTransporter(input: $input) {
      ...TransporterFragment
    }
  }
  ${TransporterFragment}
`;

export const UPDATE_FORM_TRANSPORTER = gql`
  mutation UpdateFormTransporter($id: ID!, $input: TransporterInput!) {
    updateFormTransporter(id: $id, input: $input) {
      ...TransporterFragment
    }
  }
  ${TransporterFragment}
`;

export const DELETE_FORM_TRANSPORTER = gql`
  mutation DeleteFormTransporter($id: ID!) {
    deleteFormTransporter(id: $id)
  }
`;
