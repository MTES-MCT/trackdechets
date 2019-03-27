import React, { useState } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";

const RESET_PASSWORD = gql`
  mutation ResetPassword($email: String!) {
    resetPassword(email: $email)
  }
`;
export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  return (
    <section className="section section-white">
      <div className="container">
        <Mutation mutation={RESET_PASSWORD}>
          {(resetPassword, { data, error }) => (
            <form
              onSubmit={e => {
                e.preventDefault();
                resetPassword({ variables: { email } })
                  .then(_ => setShowSuccess(true))
                  .catch(err => setError(err.message));
                setError("");
                setShowSuccess(false);
                setEmail("");
              }}
            >
              <h1>Réinitialisation de votre mot de passe</h1>
              <p>
                Afin de réinitialiser votre mot de passe, merci de saisir votre
                email. Un nouveau mot de passe vous sera transmis.
              </p>
              <div className="form__group">
                <label>
                  <input
                    type="text"
                    placeholder="Saisissez votre email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </label>
              </div>

              <button className="button" type="submit">
                Réinitialiser
              </button>
            </form>
          )}
        </Mutation>
        {showSuccess && (
          <div className="notification success">
            Un email avec votre nouveau mot de passe vient de vous être envoyé.
          </div>
        )}
        {error && (
          <div className="notification error">
            Une erreur est survenue: {error}
          </div>
        )}
      </div>
    </section>
  );
}
