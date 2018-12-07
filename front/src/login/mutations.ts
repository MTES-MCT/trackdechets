import gql from "graphql-tag";

export const SIGNUP = gql`
  mutation Signup($payload: SignupInput) {
    signup(payload: $payload) {
      token
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`;

export const CHANGEPASSWORD = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      token
    }
  }
`;
