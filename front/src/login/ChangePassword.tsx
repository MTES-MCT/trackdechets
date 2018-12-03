import { ErrorMessage, Field, Form, Formik, FormikActions } from "formik";
import React from "react";
import { Mutation, MutationFn } from "react-apollo";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { LOGIN } from "./mutations";

type Values = {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
};
const handleSubmit = (
  payload: Values,
  props: FormikActions<Values> & { login: MutationFn } & RouteComponentProps
) => {
  const { oldPassword, newPassword } = payload;
  props
    .login({ variables: { oldPassword, newPassword } })
    .then(response => {
      response &&
        window.localStorage.setItem("td-token", response.data.login.token);
      props.history.push("/dashboard");
    })
    .catch(e => {
      const errors = e.graphQLErrors.map(
        (error: { message: string }) => error.message
      );
      props.setSubmitting(false);
      props.setErrors({ oldPassword: "Erreur. Vérifiez la saisie de votre ancien mot de passe." });
    });
};

export default withRouter(function Login(
  routeComponentProps: RouteComponentProps
) {
  return (
    <Mutation mutation={LOGIN}>
      {(login, { data }) => (
        <Formik
          initialValues={{
            oldPassword: "",
            newPassword: "",
            newPasswordConfirmation: ""
          }}
          onSubmit={(values, formikActions) => {
            handleSubmit(values, {
              login,
              ...formikActions,
              ...routeComponentProps
            });
          }}
          validate={values => {
            let errors: any = {};
            if (values.newPassword !== values.newPasswordConfirmation) {
              errors.newPasswordConfirmation =
                "Les deux mots de passe ne sont pas identiques.";
            }
            return errors;
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="container">
                <div className="form__group">
                  <label>
                    Ancien mot de passe:
                    <Field type="password" name="oldPassword" />
                  </label>
                  <ErrorMessage name="oldPassword" component="div" />
                </div>

                <div className="form__group">
                  <label>
                    Nouveau mot de passe:
                    <Field type="password" name="newPassword" />
                  </label>
                </div>

                <div className="form__group">
                  <label>
                    Confirmation du nouveau mot de passe:
                    <Field type="password" name="newPasswordConirmation" />
                  </label>
                  <ErrorMessage name="newPasswordConirmation" component="div" />
                </div>

                <button
                  className="button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  Enregistrer
                </button>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </Mutation>
  );
});
