import { useMutation, gql } from "@apollo/client";
import React, { useState } from "react";
import { NotificationError } from "../common/components/Error";
import { Mutation, MutationResetPasswordArgs } from "generated/graphql/types";

const RESEND_ACTIVATION_EMAIL = gql`
  mutation ResendActivationEmail($email: String!) {
    resendActivationEmail(email: $email)
  }
`;
export default function ResendActivationEmail() {
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [resendActivationEmail, { error }] = useMutation<
    Pick<Mutation, "resendActivationEmail">,
    MutationResetPasswordArgs
  >(RESEND_ACTIVATION_EMAIL);
  return (
    <section className="section section--white">
      <div className="container">
        <form
          onSubmit={e => {
            e.preventDefault();
            resendActivationEmail({ variables: { email } })
              .then(_ => setShowSuccess(true))
              .catch(_ => setShowSuccess(false));
          }}
        >
          <h1 className="h1">Renvoyer l'email d'activation</h1>
          <p className="tw-my-2">
            Si vous n'avez pas reçu d'email d'activation suite à votre
            inscription, vous pouvez en renvoyer un en renseignant votre adresse
            email ci-dessous :
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
              Renvoyer l'email
            </button>
          </div>
        </form>
        {showSuccess && (
          <div className="notification success tw-mt-2">
            Un email d'activation vous a été renvoyé.
          </div>
        )}
        {error && <NotificationError apolloError={error} />}
      </div>
    </section>
  );
}
