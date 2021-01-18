import { gql } from "@apollo/client";
import { fullFormFragment } from "common/fragments";

// graphql query for BSD in the draft tab
export const DRAFT_TAB_FORMS = gql`
  query GetDraftTabForms($siret: String, $cursorAfter: ID) {
    forms(siret: $siret, status: [DRAFT], cursorAfter: $cursorAfter) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

// graphql query for BSD in the act tab
export const ACT_TAB_FORMS = gql`
  query GetActTabForms($siret: String, $cursorAfter: ID) {
    forms(
      siret: $siret
      status: [
        SENT
        RECEIVED
        ACCEPTED
        TEMP_STORED
        TEMP_STORER_ACCEPTED
        RESENT
      ]
      cursorAfter: $cursorAfter
      hasNextStep: true
    ) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

// graphql query for BSD in the follow tab
export const FOLLOW_TAB_FORMS = gql`
  query GetFollowTabForms($siret: String, $cursorAfter: ID) {
    forms(
      siret: $siret
      status: [
        SEALED
        SENT
        RECEIVED
        ACCEPTED
        TEMP_STORED
        TEMP_STORER_ACCEPTED
        RESEALED
        RESENT
        AWAITING_GROUP
        GROUPED
      ]
      hasNextStep: false
      cursorAfter: $cursorAfter
    ) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

// graphql query for BSD in the history tab
export const HISTORY_TAB_FORMS = gql`
  query GetHistoryTabForms($siret: String, $cursorAfter: ID) {
    forms(
      siret: $siret
      status: [PROCESSED, NO_TRACEABILITY, REFUSED]
      cursorAfter: $cursorAfter
    ) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;
