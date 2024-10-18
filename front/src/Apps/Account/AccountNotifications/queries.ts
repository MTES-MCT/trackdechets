import gql from "graphql-tag";

export const SUBSCRIBE_TO_COMPANY_NOTIFICATIONS = gql`
  mutation SubscribeToCompanyNotifications(
    $input: SubscribeToCompanyNotificationsInput!
  ) {
    subscribeToCompanyNotifications(input: $input) {
      id
      orgId
      userNotifications {
        membershipRequest
        signatureCodeRenewal
        bsdRefusal
        bsdaFinalDestinationUpdate
        revisionRequest
      }
    }
  }
`;

export const SUBSCRIBE_TO_NOTIFICATIONS = gql`
  mutation SubscribeToNotifications($input: SubscribeToNotificationsInput!) {
    subscribeToNotifications(input: $input) {
      id
      orgId
      userNotifications {
        membershipRequest
        signatureCodeRenewal
        bsdRefusal
        bsdaFinalDestinationUpdate
        revisionRequest
      }
    }
  }
`;
