import gql from "graphql-tag";

export const SET_COMPANY_NOTIFICATIONS = gql`
  mutation SetCompanyNotifications($input: SetCompanyNotificationsInput!) {
    setCompanyNotifications(input: $input) {
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
