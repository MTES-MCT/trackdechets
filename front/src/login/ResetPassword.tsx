import { useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import React, { useState } from "react";
import { NotificationError } from "../common/components/Error";
import { Mutation, MutationResetPasswordArgs } from "generated/graphql/types";

const RESET_PASSWORD = gql`
  mutation ResetPassword($email: String!) {
    resetPassword(email: $email)
  }
`;
export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [resetPassword, { error }] = useMutation<
    Pick<Mutation, "resetPassword">,
    MutationResetPasswordArgs
  >(RESET_PASSWORD);
  return (
    <section className="section section--white">
      <div className="container">
        <form
          onSubmit={e => {
            e.preventDefault();
            resetPassword({ variables: { email } }).then(_ =>
              setShowSuccess(true)
            );
            setShowSuccess(false);
            setEmail("");
          }}
        >
          <h1 className="h1">Réinitialisation de votre mot de passe</h1>
          <p className="tw-my-2">
            Afin de réinitialiser votre mot de passe, merci de saisir votre
            email. Un nouveau mot de passe vous sera transmis.
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
            Un email avec votre nouveau mot de passe vient de vous être envoyé.
          </div>
        )}
        {error && <NotificationError apolloError={error} />}
      </div>
    </section>
  );
}
