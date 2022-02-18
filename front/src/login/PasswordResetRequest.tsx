import { useMutation, gql } from "@apollo/client";
import React, { useState } from "react";
import { NotificationError } from "../common/components/Error";
import {
  Mutation,
  MutationCreatePasswordResetRequestArgs,
} from "generated/graphql/types";

const RESET_PASSWORD = gql`
  mutation CreatePasswordResetRequest($email: String!) {
    createPasswordResetRequest(email: $email)
  }
`;
export default function PasswordResetRequest() {
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [createPasswordResetReques, { error }] = useMutation<
    Pick<Mutation, "createPasswordResetRequest">,
    MutationCreatePasswordResetRequestArgs
  >(RESET_PASSWORD);
  return (
    <section className="section section--white">
      <div className="container">
        <form
          onSubmit={async e => {
            e.preventDefault();
            setShowSuccess(false);
            setEmail("");

            try {
              await createPasswordResetReques({ variables: { email } });
              setShowSuccess(true);
            } catch (err) {
              // The error is handled in the UI
            }
          }}
        >
          <h1 className="h1">Réinitialisation de votre mot de passe</h1>
          <p className="tw-my-2">
            Afin de réinitialiser votre mot de passe, merci de saisir votre
            email. Un lien vous sera transmis à cette adresse email.
          </p>
          <div className="form__row tw-my-2">
            <label>
              <input
                type="text"
                placeholder="Saisissez votre email"
                className="td-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </label>
          </div>
          <div className="form__actions">
            <button className="btn btn--primary" type="submit">
              Réinitialiser
            </button>
          </div>
        </form>
        {showSuccess && (
          <div className="notification success tw-mt-2">
            Un email vient de vous être envoyé (vérifiez aussi dans votre
            dossier de spams).
          </div>
        )}
        {error && <NotificationError apolloError={error} />}
      </div>
    </section>
  );
}
