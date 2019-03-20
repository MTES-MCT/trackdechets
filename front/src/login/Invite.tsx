import React from "react";
import { Mutation } from "react-apollo";
import { Formik, Form, Field, ErrorMessage } from "formik";
import gql from "graphql-tag";
import { withRouter, RouteComponentProps } from "react-router";

const JOIN_WITH_INVITE = gql`
  mutation JoinWithInvite($hash: String!, $name: String!, $password: String!) {
    joinWithInvite(hash: $hash, name: $name, password: $password) {
      token
    }
  }
`;

type Props = { hash: string };
export default withRouter(function Invite(props: Props & RouteComponentProps) {
  return (
    <Mutation mutation={JOIN_WITH_INVITE}>
      {(joinWithInvite, { data }) => (
        <Formik
          initialValues={{
            hash: props.hash,
            name: "",
            password: "",
            passwordConfirmation: ""
          }}
          validate={(values: any) => {
            let errors: any = {};
            if (values.password !== values.passwordConfirmation) {
              errors.passwordConfirmation =
                "Les deux mots de passe ne sont pas identiques.";
            }
            return errors;
          }}
          onSubmit={(values, { setStatus, setSubmitting }) => {
            const { passwordConfirmation, ...payload } = values;
            joinWithInvite({ variables: payload })
              .then(_ => props.history.push("/dashboard/slips"))
              .catch(_ => setStatus("Erreur technique."))
              .then(_ => setSubmitting(false));
          }}
        >
          {({ isSubmitting }) => (
            <section className="section section-white">
              <div className="container">
                <Form>
                  <h1>Validez votre inscription</h1>

                  <p>
                    Vous avez été invité à rejoindre Trackdéchets. Pour valider
                    votre inscription, veuillez compléter le formulaire
                    ci-dessous.
                  </p>
                  <div className="form__group">
                    <label>
                      Nom et prénom*
                      <Field type="text" name="name" />
                    </label>
                  </div>

                  <div className="form__group">
                    <label>
                      Mot de passe*
                      <Field type="password" name="password" />
                    </label>
                  </div>

                  <div className="form__group">
                    <label>
                      Vérification du mot de passe*
                      <Field type="password" name="passwordConfirmation" />
                    </label>
                  </div>

                  <ErrorMessage
                    name="passwordConfirmation"
                    render={msg => (
                      <div className="input-error-message">{msg}</div>
                    )}
                  />

                  <button
                    className="button"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    Valider l'inscription
                  </button>
                </Form>
              </div>
            </section>
          )}
        </Formik>
      )}
    </Mutation>
  );
});
