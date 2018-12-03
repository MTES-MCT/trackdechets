import { ErrorMessage, Field, Form, Formik, FormikActions } from "formik";
import React from "react";
import { Mutation, MutationFn } from "react-apollo";
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";
import { SIGNUP } from "./mutations";

type Values = {};
const handleSumbit = (
  payload: Values,
  props: FormikActions<Values> & { signup: MutationFn } & RouteComponentProps
) => {
  props.signup({ variables: payload }).then(response => {
    response &&
      window.localStorage.setItem("td-token", response.data.login.token);
    props.history.push("/dashboard");
  });
};

export default withRouter(function Signup(routerProps: RouteComponentProps) {
  return (
    <Mutation mutation={SIGNUP}>
      {signup => (
        <Formik
          initialValues={{
            email: "",
            name: "",
            phone: "",
            password: "",
            passwordConfirmation: "",
            siret: ""
          }}
          onSubmit={(values, formikActions) =>
            handleSumbit(values, { ...routerProps, ...formikActions, signup })
          }
          validate={values => {
            let errors: any = {};
            if (values.password !== values.passwordConfirmation) {
              errors.passwordConfirmation =
                "Les deux mots de passe ne sont pas identiques.";
            }

            !values.email ? (errors.email = "L'email est obligatoire") : null;
            !values.name
              ? (errors.name = "Le nom et prénom sont obligatoires")
              : null;

            return errors;
          }}
        >
          {({ isSubmitting }) => (
            <div className="container">
              <Form>
                <h1>Inscription à Trackdéchets</h1>
                <p>
                  Blabla création de compte. Création de compte pour son
                  entreprise afin d'administrer les bordereaux. Un seul compte
                  par entreprise actuellement... Lorem ipsum dolor sit amet
                  consectetur adipisicing elit. Eligendi sint, animi excepturi
                  ipsam omnis magni cum veniam illo neque magnam quo placeat
                  asperiores sit dignissimos ex aperiam, eum, ducimus quidem.
                </p>
                <div className="form__group">
                  <label>
                    Email*:
                    <Field type="text" name="email" />
                  </label>

                  <ErrorMessage name="email" component="div" />
                </div>

                <div className="form__group">
                  <label>
                    Nom et prénom*:
                    <Field type="text" name="name" />
                  </label>

                  <ErrorMessage name="name" component="div" />
                </div>

                <div className="form__group">
                  <label>
                    Téléphone:
                    <Field type="text" name="phone" />
                  </label>
                </div>

                <div className="form__group">
                  <label>
                    Mot de passe:
                    <Field type="password" name="password" />
                  </label>
                </div>

                <div className="form__group">
                  <label>
                    Vérification du mot de passe:
                    <Field type="password" name="passwordConfirmation" />
                  </label>
                </div>

                <ErrorMessage name="passwordConfirmation" component="div" />

                <div className="form__group">
                  <label>
                    Numéro SIRET de l'entreprise que vous administrez:
                    <Field type="text" name="siret" />
                  </label>
                </div>

                <button
                  className="button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  S'inscrire
                </button>

                <p>
                  Vous avez déjà un compte ?{" "}
                  <Link to="/login">Connectez vous maintenant</Link>
                </p>
              </Form>
            </div>
          )}
        </Formik>
      )}
    </Mutation>
  );
});
