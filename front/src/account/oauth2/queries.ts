import gql from "graphql-tag";

const ApplicationFragment = gql`
  fragment ApplicationFragment on Application {
    id
    name
    logoUrl
    goal
    redirectUris
    clientSecret
  }
`;

export const APPLICATIONS = gql`
  query GetApplications {
    applications {
      ...ApplicationFragment
    }
  }
  ${ApplicationFragment}
`;

export const APPLICATION = gql`
  query Application($id: ID!) {
    application(id: $id) {
      ...ApplicationFragment
    }
  }
  ${ApplicationFragment}
`;

export const CREATE_APPLICATION = gql`
  mutation CreateApplication($input: CreateApplicationInput!) {
    createApplication(input: $input) {
      ...ApplicationFragment
    }
  }
  ${ApplicationFragment}
`;

export const UPDATE_APPLICATION = gql`
  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
    updateApplication(id: $id, input: $input) {
      ...ApplicationFragment
    }
  }
  ${ApplicationFragment}
`;

export const DELETE_APPLICATION = gql`
  mutation DeleteApplication($id: ID!) {
    deleteApplication(id: $id) {
      ...ApplicationFragment
    }
  }
  ${ApplicationFragment}
`;
