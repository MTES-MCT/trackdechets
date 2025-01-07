import { gql } from "@apollo/client";

const ApplicationFragment = gql`
  fragment ApplicationFragment on Application {
    id
    name
    goal
    redirectUris
    clientSecret
  }
`;

export const MY_APPLICATIONS = gql`
  query MyApplications {
    myApplications {
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
