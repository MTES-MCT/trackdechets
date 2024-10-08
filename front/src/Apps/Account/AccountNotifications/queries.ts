import gql from "graphql-tag";

export const UPDATE_EMAIL_NOTIFICATIONS = gql`
  mutation UpdateEmailNotifications($input: UpdateEmailNotificationsInput!) {
    updateEmailNotifications(input: $input) {
      id
      orgId
      emailNotifications
    }
  }
`;
