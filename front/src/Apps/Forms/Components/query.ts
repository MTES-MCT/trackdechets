import gql from "graphql-tag";
import { transporterFragment } from "../../common/queries/fragments";

export const CREATE_FORM_TRANSPORTER = gql`
  mutation CreateFormTransporter($input: TransporterInput!) {
    createFormTransporter(input: $input) {
      ...TransporterFragment
    }
  }
  ${transporterFragment}
`;

export const UPDATE_FORM_TRANSPORTER = gql`
  mutation UpdateFormTransporter($id: ID!, $input: TransporterInput!) {
    updateFormTransporter(id: $id, input: $input) {
      ...TransporterFragment
    }
  }
  ${transporterFragment}
`;

export const DELETE_FORM_TRANSPORTER = gql`
  mutation DeleteFormTransporter($id: ID!) {
    deleteFormTransporter(id: $id)
  }
`;

export const BsdaTransporterFragment = gql`
  fragment BsdaTransporterFragment on BsdaTransporter {
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
    recepisse {
      isExempted
      number
      validityLimit
      department
    }
    transport {
      mode
      plates
      signature {
        date
      }
    }
  }
`;

export const BsvhuTransporterFragment = gql`
  fragment BsvhuTransporterFragment on BsvhuTransporter {
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
    recepisse {
      isExempted
      number
      validityLimit
      department
    }
    transport {
      mode
      plates
      signature {
        date
      }
    }
  }
`;

export const CREATE_BSDA_TRANSPORTER = gql`
  mutation CreateBsdaTransporter($input: BsdaTransporterInput!) {
    createBsdaTransporter(input: $input) {
      ...BsdaTransporterFragment
    }
  }
  ${BsdaTransporterFragment}
`;

export const UPDATE_BSDA_TRANSPORTER = gql`
  mutation UpdateBsdaTransporter($id: ID!, $input: BsdaTransporterInput!) {
    updateBsdaTransporter(id: $id, input: $input) {
      ...BsdaTransporterFragment
    }
  }
  ${BsdaTransporterFragment}
`;

export const DELETE_BSDA_TRANSPORTER = gql`
  mutation DeleteBsdaTransporter($id: ID!) {
    deleteBsdaTransporter(id: $id)
  }
`;

export const CREATE_BSVHU_TRANSPORTER = gql`
  mutation CreateBsvhuTransporter($input: BsvhuTransporterInput!) {
    createBsvhuTransporter(input: $input) {
      ...BsvhuTransporterFragment
    }
  }
  ${BsvhuTransporterFragment}
`;

export const UPDATE_BSVHU_TRANSPORTER = gql`
  mutation UpdateBsvhuTransporter($id: ID!, $input: BsvhuTransporterInput!) {
    updateBsvhuTransporter(id: $id, input: $input) {
      ...BsvhuTransporterFragment
    }
  }
  ${BsvhuTransporterFragment}
`;

export const DELETE_BSVHU_TRANSPORTER = gql`
  mutation DeleteBsvhuTransporter($id: ID!) {
    deleteBsvhuTransporter(id: $id)
  }
`;

export const BsffTransporterFragment = gql`
  fragment BsffTransporterFragment on BsffTransporter {
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
    recepisse {
      isExempted
      number
      validityLimit
      department
    }
    transport {
      mode
      plates
      signature {
        date
      }
    }
  }
`;

export const CREATE_BSFF_TRANSPORTER = gql`
  mutation CreateBsffTransporter($input: BsffTransporterInput!) {
    createBsffTransporter(input: $input) {
      ...BsffTransporterFragment
    }
  }
  ${BsffTransporterFragment}
`;

export const UPDATE_BSFF_TRANSPORTER = gql`
  mutation UpdateBsffTransporter($id: ID!, $input: BsffTransporterInput!) {
    updateBsffTransporter(id: $id, input: $input) {
      ...BsffTransporterFragment
    }
  }
  ${BsffTransporterFragment}
`;

export const DELETE_BSFF_TRANSPORTER = gql`
  mutation DeleteBsffTransporter($id: ID!) {
    deleteBsffTransporter(id: $id)
  }
`;
