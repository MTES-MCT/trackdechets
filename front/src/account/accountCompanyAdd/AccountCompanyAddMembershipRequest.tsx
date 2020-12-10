import { useMutation, gql } from "@apollo/client";
import { NotificationError } from "common/components/Error";
import React from "react";

const SEND_MEMBERSHIP_REQUEST = gql`
  mutation SendMembershipRequest($siret: String!) {
    sendMembershipRequest(siret: $siret) {
      email
    }
  }
`;

/**
 * Allows users to send an invitation request to join a company
 * when there is already an admin for this company
 */
export default function AccountCompanyAddInvitationRequest({ siret }) {
  const [sendMembershipRequest, { data, error, loading }] = useMutation(
    SEND_MEMBERSHIP_REQUEST
  );

  if (data) {
    return (
      <div className="notification notification--success">
        <p>
          Demande de rattachement envoyée. Vous recevrez un email de
          confirmation lorsque votre demande sera validée
        </p>
      </div>
    );
  }

  return (
    <div className="notification">
      <p>
        Vous pouvez demander à l'administrateur de rejoindre l'établissement
      </p>
      <button
        type="button"
        className="btn btn--primary tw-mt-5"
        onClick={() =>
          sendMembershipRequest({
            variables: { siret: siret.replace(/\s/g, "") },
          })
        }
      >
        {loading ? "Envoi..." : "Envoyer une demande de rattachement"}
      </button>
      {error && <NotificationError apolloError={error} />}
    </div>
  );
}
