import React from "react";
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
  return (
    <div>
      <p>
        Vous êtes administrateur de cette entreprise, vous pouvez ainsi inviter
        des utilisateurs à rejoindre Trackdéchets et leur donner accès aux
        informations de votre entreprise.
      </p>

      <Mutation mutation={INVITE_USER_TO_COMPANY}>
        {(inviteUserToCompany, { data }) => (
          <Formik
            initialValues={{ email: "", siret }}
            onSubmit={(values, { setSubmitting, resetForm }) => {
              inviteUserToCompany({ variables: values })
                .then(_ => resetForm())
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
    </div>
  );
}
