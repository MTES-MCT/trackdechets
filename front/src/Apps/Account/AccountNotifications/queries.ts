import gql from "graphql-tag";

const CompanyFragment = gql`
  fragment CompanyFragment on CompanyPrivate {
    id
    orgId
    userNotifications {
      membershipRequest
      signatureCodeRenewal
      bsdRefusal
      bsdaFinalDestinationUpdate
      revisionRequest
      registryDelegation
    }
    users {
      id
      orgId
      email
      notifications {
        membershipRequest
        signatureCodeRenewal
        bsdRefusal
        bsdaFinalDestinationUpdate
        revisionRequest
        registryDelegation
      }
    }
  }
`;

export const SUBSCRIBE_TO_COMPANY_NOTIFICATIONS = gql`
  mutation SubscribeToCompanyNotifications(
    $input: SubscribeToCompanyNotificationsInput!
  ) {
    subscribeToCompanyNotifications(input: $input) {
      ...CompanyFragment
    }
  }
  ${CompanyFragment}
`;

export const SUBSCRIBE_TO_NOTIFICATIONS = gql`
  mutation SubscribeToNotifications($input: SubscribeToNotificationsInput!) {
    subscribeToNotifications(input: $input) {
      ...CompanyFragment
    }
  }
  ${CompanyFragment}
`;
