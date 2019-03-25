import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import "./InviteNewUser.scss";
import { Mutation, Query } from "react-apollo";
import gql from "graphql-tag";
import { Me } from "../../login/model";
import RedErrorMessage from "../../form/RedErrorMessage";

const INVITE_USER_TO_COMPANY = gql`
  mutation InviteUserToCompany($email: String!, $siret: String!) {
    inviteUserToCompany(email: $email, siret: $siret)
  }
`;
const COMPANY_USERS = gql`
  query CompanyUsers($siret: String!) {
    companyUsers(siret: $siret) {
      id
      name
      email
    }
  }
`;
type Props = { siret: string };
export default function ImportNewUser({ siret }: Props) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCompanyUsers, setShowCompanyUsers] = useState(false);

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
            validate={(values: any) => {
              let errors: any = {};
              if (!values.email) {
                errors.email = "L'email est obligatoire";
              }
              return errors;
            }}
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

                <RedErrorMessage name="email" />
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

      <p>
        Vous souhaitez voir qui appartient déjà à cette entreprise ? Consultez
        la liste en{" "}
        <button
          className="button-outline small primary"
          onClick={() => setShowCompanyUsers(true)}
        >
          cliquant ici
        </button>
      </p>
      {showCompanyUsers && (
        <Query query={COMPANY_USERS} variables={{ siret }}>
          {({ loading, error, data }) => {
            if (loading) return "Chargement...";
            if (error) return `Erreur ! ${error.message}`;

            return (
              <ul>
                {data.companyUsers.map((u: any) => (
                  <li key={u.id}>{u.name}</li>
                ))}
              </ul>
            );
          }}
        </Query>
      )}
    </div>
  );
}
