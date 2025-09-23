import { useMutation } from "@apollo/client";
import { NotificationError } from "../../../common/Components/Error/Error";
import React from "react";
import { cleanClue } from "@td/constants";
import { SEND_MEMBERSHIP_REQUEST } from "../../common/queries";

const displayUnredactedEmailAddresses = sentTo => {
  const clearEmailAddresses = sentTo.filter(adr => !adr.includes("***"));
  if (!clearEmailAddresses.length) {
    return null;
  }
  const emailText =
    clearEmailAddresses.length > 1
      ? "une de ces adresses :"
      : "cette adresse : ";
  return (
    <>
      Si vous n'avez pas de retour au bout de quelques jours, vous pouvez
      contacter {emailText} <strong>{clearEmailAddresses.join(", ")}</strong>
    </>
  );
};
/**
 * Allows users to send an invitation request to join a company
 * when there is already an admin for this company
 */
export default function AccountCompanyAddInvitationRequest({ siret }) {
  const [sendMembershipRequest, { data, error, loading }] = useMutation(
    SEND_MEMBERSHIP_REQUEST,
    {
      onError: () => {
        // The error is handled in the UI
      }
    }
  );

  if (data) {
    return (
      <div className="notification notification--success tw-mt-1">
        <p>
          Demande de rattachement envoyée. Vous recevrez un courriel de
          confirmation lorsque votre demande sera validée. <br />
          {displayUnredactedEmailAddresses(data.sendMembershipRequest.sentTo)}
        </p>
      </div>
    );
  }

  return (
    <div className="notification tw-mt-1">
      <p>
        Vous pouvez demander à l'administrateur de rejoindre l'établissement
      </p>
      <button
        type="button"
        className="btn btn--primary tw-mt-5"
        onClick={() =>
          sendMembershipRequest({
            variables: { siret: cleanClue(siret) }
          })
        }
      >
        {loading ? "Envoi..." : "Envoyer une demande de rattachement"}
      </button>
      {error && <NotificationError apolloError={error} />}
    </div>
  );
}
