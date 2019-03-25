import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import "./InviteNewUser.scss";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";

const INVITE_USER_TO_COMPANY = gql`
  mutation InviteUserToCompany($email: String!, $siret: String!) {
    inviteUserToCompany(email: $email, siret: $siret)
  }
`;
type Props = { siret: string };
export default function ImportNewUser({ siret }: Props) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <div>
      <p>
        Vous êtes administrateur de cette entreprise, vous pouvez ainsi inviter
        des utilisateurs à rejoindre Trackdéchets en leur donnant accès aux
        informations de votre entreprise. Ils seront alors en mesure de créer
        des bordereaux pour cette entreprise, et de consulter les bordereaux
        déjà existants.
      </p>

      <Mutation mutation={INVITE_USER_TO_COMPANY}>
        {(inviteUserToCompany, { data }) => (
          <Formik
            initialValues={{ email: "", siret }}
            onSubmit={(values, { setSubmitting, resetForm }) => {
              inviteUserToCompany({ variables: values })
                .then(_ => {
                  resetForm();
                  setShowConfirmation(true);
                  setTimeout(() => setShowConfirmation(false), 3000);
                })
                .then(_ => setSubmitting(false));
            }}
          >
            {({ isSubmitting }) => (
              <Form className="invite-form">
                <Field
                  type="email"
                  name="email"
                  placeholder="Email de la personne à inviter"
                />
                <button
                  type="submit"
                  className="button"
                  disabled={isSubmitting}
                >
                  Inviter
                </button>
              </Form>
            )}
          </Formik>
        )}
      </Mutation>
      {showConfirmation && (
        <div className="notification success">
          L'invitation a bien été envoyée
        </div>
      )}
    </div>
  );
}
