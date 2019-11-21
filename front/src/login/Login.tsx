import { ErrorMessage, Field, Form, Formik, FormikActions } from "formik";
import React from "react";
import { Mutation } from "@apollo/react-components";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { LOGIN } from "./mutations";
import { localAuthService } from "./auth.service";

type Values = { email: string; password: string; form: string };
const handleSubmit = (
  payload: Values,
  props: FormikActions<Values> & { login } & RouteComponentProps
) => {
  const { email, password } = payload;
  props
    .login({ variables: { email, password } })
    .then(response => {
      response &&
        localAuthService.locallyAutheticate(response.data.login.token);
      props.history.push("/dashboard/slips");
    })
    .catch(e => {
      const errors = e.graphQLErrors.map(
        (error: { message: string }) => error.message
      );
      props.setSubmitting(false);
      props.setErrors({ email: " ", password: " ", form: errors });
    });
};

export default withRouter(function Login(
  routeComponentProps: RouteComponentProps
) {
  return (
    <Mutation mutation={LOGIN}>
      {login => (
        <Formik
          initialValues={{ email: "", password: "", form: "" }}
          onSubmit={(values, formikActions) => {
            handleSubmit(values, {
              login,
              ...formikActions,
              ...routeComponentProps
            });
          }}
        >
          {({ isSubmitting }) => (
            <section className="section section-white">
              <div className="container">
                <Form>
                  <h1>Connexion</h1>
                  <div className="form__group">
                    <label>
                      Email
                      <Field type="text" name="email" />
                    </label>
                  </div>

                  <div className="form__group">
                    <label>
                      Mot de passe
                      <Field type="password" name="password" />
                    </label>
                  </div>

                  <ErrorMessage
                    name="form"
                    render={msg => (
                      <div className="input-error-message">{msg}</div>
                    )}
                  />

                  <button
                    className="button"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    Se connecter
                  </button>

                  <p>
                    Vous n'avez pas encore de compte ?{" "}
                    <Link to="/signup">Inscrivez vous maintenant</Link>
                  </p>
                  <p>
                    Vous avez perdu votre mot de passe ?{" "}
                    <Link to="/reset-password">Réinitialisez le</Link>
                  </p>
                </Form>
              </div>
            </section>
          )}
        </Formik>
      )}
    </Mutation>
  );
});
