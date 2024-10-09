import gql from "graphql-tag";

export const UPDATE_NOTIFICATIONS = gql`
  mutation UpdateNotifications($input: UpdateNotificationsInput!) {
    updateNotifications(input: $input) {
      id
      orgId
      notifications
    }
  }
`;
