import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import "./InviteNewUser.scss";
import { Mutation, Query } from "react-apollo";
import gql from "graphql-tag";
import RedErrorMessage from "../../form/RedErrorMessage";
import { FaTimes } from "react-icons/fa";
import { Me } from "../../login/model";

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
      role
    }
  }
`;
const REMOVE_USER = gql`
  mutation RemoveUserFromCompany($userId: ID!, $siret: String!) {
    removeUserFromCompany(userId: $userId, siret: $siret)
  }
`;
type Props = { siret: string; me: Me };
export default function ImportNewUser({ siret, me }: Props) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <React.Fragment>
      <button className="button" onClick={() => setShowAdmin(!showAdmin)}>
        Inviter des collaborateurs
      </button>
      {showAdmin && (
        <div>
          <p>
            Vous êtes administrateur de cette entreprise, vous pouvez ainsi
            inviter des utilisateurs à rejoindre Trackdéchets en leur donnant
            accès aux informations de votre entreprise. Ils seront alors en
            mesure de créer des bordereaux pour cette entreprise, et de
            consulter les bordereaux déjà existants.
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
          <Query query={COMPANY_USERS} variables={{ siret }}>
            {({ loading, error, data }) => {
              if (loading) return "Chargement...";
              if (error) return `Erreur ! ${error.message}`;

              return (
                <div>
                  <h5>Membres de l'équipe ({data.companyUsers.length})</h5>
                  <table className="table">
                    <tbody>
                      {data.companyUsers.map((u: any) => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.role}</td>
                          <td className="right-column">
                            {me.id !== u.id && u.name !== "Invité" && (
                              <Mutation
                                mutation={REMOVE_USER}
                                update={proxy => {
                                  const data = proxy.readQuery<{
                                    companyUsers: any[];
                                  }>({ query: COMPANY_USERS });
                                  if (!data || !data.companyUsers) {
                                    return;
                                  }
                                  proxy.writeQuery({
                                    query: COMPANY_USERS,
                                    data: data.companyUsers.filter(
                                      cu => cu.id !== u.id
                                    )
                                  });
                                }}
                              >
                                {(removeUserFromCompany, { data }) => (
                                  <button
                                    className="button"
                                    onClick={() =>
                                      removeUserFromCompany({
                                        variables: { userId: u.id, siret }
                                      })
                                    }
                                  >
                                    <FaTimes /> Retirer les droits
                                  </button>
                                )}
                              </Mutation>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }}
          </Query>
        </div>
      )}
    </React.Fragment>
  );
}
