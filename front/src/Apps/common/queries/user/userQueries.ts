import { gql } from "@apollo/client";

export const UPDATE_TRACKING_CONSENT = gql`
  mutation UpdateTrackingConsent($trackingConsent: Boolean!) {
    editProfile(trackingConsent: $trackingConsent) {
      id
      trackingConsent
    }
  }
`;
