import { gql } from "@apollo/client";

export const SIGNUP = gql`
  mutation Signup($userInfos: SignupInput!) {
    signup(userInfos: $userInfos)
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`;
