import { useMutation } from "@apollo/react-hooks";
import { NotificationError } from "common/components/Error";
import gql from "graphql-tag";
import React from "react";
import { FaHourglassHalf } from "react-icons/fa";

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
      <div>
        <h4 className="h4">Demande de rattachement envoyée</h4>
        <div>
          Vous recevrez un email de confirmation lorsque votre demande sera
          validée
        </div>
      </div>
    );
  }

  return (
    <div>
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
          {loading ? (
            <FaHourglassHalf />
          ) : (
            "Envoyer une demande de rattachement"
          )}
        </button>
        {error && <NotificationError apolloError={error} />}
      </div>
    </div>
  );
}
